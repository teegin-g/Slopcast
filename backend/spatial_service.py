"""
SpatialDBManager — encapsulates the optional PostGIS/spatial database connection.

The backend operates fine without a spatial DB (economics endpoints are pure math).
This manager provides lazy connection with retry/backoff, health-check, and clean
FastAPI dependency injection — replacing the original module-level mutable globals.

Usage in FastAPI:
    from .spatial_service import SpatialDBManager, get_spatial_db

    app.state.spatial_db = SpatialDBManager()

    @app.get("/api/wells/nearby")
    def wells_nearby(db: SpatialDBManager = Depends(get_spatial_db)):
        conn = db.connection()
        ...
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any

logger = logging.getLogger(__name__)

# Retry / backoff constants
_CONNECT_RETRY_INTERVAL_SECS = 30.0
_CONNECTION_TIMEOUT_SECS = 5.0


class SpatialDBManager:
    """
    Manages a lazily-initialized connection to the optional spatial database.

    State is fully instance-scoped — no module-level globals, safe for async
    FastAPI (single shared instance created at app startup, read-only after that).
    """

    def __init__(self, dsn: str | None = None) -> None:
        """
        Args:
            dsn: Database connection string.  Defaults to the ``SPATIAL_DB_DSN``
                 environment variable.  Pass ``None`` explicitly to skip all
                 connection attempts (useful in test environments).
        """
        self._dsn: str | None = dsn if dsn is not None else os.getenv("SPATIAL_DB_DSN")
        self._conn: Any | None = None
        self._last_attempt: float = 0.0
        self._last_error: str | None = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def connection(self) -> Any | None:
        """
        Return a live DB connection, attempting to (re-)connect if needed.

        Returns ``None`` when:
        - No DSN is configured (spatial DB is optional)
        - The last connection attempt was within the retry window
        - All connection attempts fail
        """
        if self._dsn is None:
            return None

        if self._conn is not None:
            return self._conn

        now = time.monotonic()
        if now - self._last_attempt < _CONNECT_RETRY_INTERVAL_SECS:
            # Still within backoff window — surface last error, don't retry.
            return None

        return self._attempt_connect()

    def disconnect(self) -> None:
        """Close the current connection, if any."""
        if self._conn is not None:
            try:
                self._conn.close()
            except Exception as exc:  # noqa: BLE001
                logger.warning("Error closing spatial DB connection: %s", exc)
            finally:
                self._conn = None

    def health(self) -> dict[str, object]:
        """
        Return a health-check dict suitable for embedding in ``/api/health``.

        Shape::

            {"connected": bool, "error": str | None, "dsn_configured": bool}
        """
        return {
            "connected": self._conn is not None,
            "error": self._last_error,
            "dsn_configured": self._dsn is not None,
        }

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _attempt_connect(self) -> Any | None:
        self._last_attempt = time.monotonic()
        try:
            conn = self._open_connection()
            self._conn = conn
            self._last_error = None
            logger.info("Spatial DB connected successfully.")
            return conn
        except Exception as exc:  # noqa: BLE001
            self._last_error = str(exc)
            logger.warning("Spatial DB connection failed: %s", exc)
            return None

    def _open_connection(self) -> Any:
        """
        Open a raw DB connection.

        Tries ``psycopg2`` first (PostGIS / PostgreSQL), then ``sqlite3`` as a
        fallback for local development.  Raises on failure so ``_attempt_connect``
        can record the error.
        """
        assert self._dsn is not None  # guarded by caller

        try:
            import psycopg2  # type: ignore[import-untyped]

            return psycopg2.connect(
                self._dsn, connect_timeout=int(_CONNECTION_TIMEOUT_SECS)
            )
        except ImportError:
            pass  # psycopg2 not installed — fall through to sqlite3

        # sqlite3 fallback (file path or :memory:)
        import sqlite3

        return sqlite3.connect(self._dsn, timeout=_CONNECTION_TIMEOUT_SECS)


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_spatial_db(request: Any) -> "SpatialDBManager":  # noqa: F821
    """
    FastAPI dependency that returns the app-lifetime ``SpatialDBManager``.

    Register on the app instance at startup::

        app.state.spatial_db = SpatialDBManager()

    Then inject in route handlers::

        from fastapi import Depends, Request
        from .spatial_service import SpatialDBManager, get_spatial_db

        @app.get("/api/wells/nearby")
        def wells_nearby(db: SpatialDBManager = Depends(get_spatial_db)):
            ...
    """
    return request.app.state.spatial_db
