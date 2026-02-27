
# Landing Page
## Main Experience

In the main hub, when the user selects slopcast, I want them to go to a landing page that has an AI search bar where they can enter queries about acreage, for example:
- "Devon Delaware undeveloped"
- "Powder River JV"
- "Continental Woodford position"

Below would also be a selectable table of all the deals a user has saved prior for them to continue working on.

After either submitting a query or selecting an existing deal, there would be a smooth transition to the main well selection or economics page, with the relevant filters already loaded.

## Considerations
Some other UI features I think could be cool would be: 
- A map of the queried or selected acreage appearing alongside the deals table gets populated to provide a brief high level overview of the area
	- Temporarily this would require the creation of a mockup DSU / unit layer, populated with generated PUD sticks (wellbore lines starting at the top of the unit and ending at the bottom)
	- Later we can add in our internal data for undeveloped wells and acreages
- Transition animations could vary with the selected theme
- At the very end, likely in the scenario tab the user can save their current deal / scenario to a supabase / lakebase DB for future editing
	- This would require creating an extensive data model that allows for efficient context storage (formation, operator, dev/undev, etc) for the main AI tab to work off of
	- Initially I want to create this DB in supabase, and then later build it in databricks lakebase

# Database Integrator
For future use we need to have a connector / feature that allows users to connect to their local database. Initially the main database we set up will be in supabase, but longer term we would integrate with databricks and SQL server, and eventually others. Biggest problem is that I don't know a whole lot about data architecture and working with external databases.
## Architecture / General Idea
Essentially we create a slopcast core schema as the source of truth. Then, the user connects the relevant tables / schemas in their database to the slopcast version of it. Like imagine the user has an actual production schema labeled 'oil_prod', in slopcast they'd drag/draw a connection from slopcast's "oil" field to the user's "oil_prod". Then an integration/connection would be set up to populate their slopcast table with the internal data they already have.
## Practical Ideas
As of right now we only have supabase configured (and its totally empty so no actual data exists), so the ideal set up is to create a synthetic supabase schema to test on and connect to. After successful integration, we'd then move to databricks.
### Tables for synthetic generation
For the supabase setup, we'd need to store data for client's actual production and forecast data (whether or not it's 3rd party doesn't matter), as well as additional attributes they have stored (because Aries allows for custom 'side tables' to add on well or project specific metadata). 

We need to create a flexible system for possible client schemas / tables that can generate synthetic data for testing and then when we work with a client/user we properly map in the daata they want.

### MVP Interface
The MVP for this feature would be a separate UI in the slopcast hub or account settings (admin acct) that the user imputes required credentials / auth to connect to their DB, and is then provided a screen/UI that allows them to drag and drop 'connections' / relationships between the slopcast schema and their own schemas. 

After finalizing their connections, we'd start up a job or something that creates them their own slopcast database based on existing data. Once the DB is set up, the user could then go about making deals based on their current internal assumptions.

### Usage Considerations
Supabase tables vs file storage on the free tier isn't particularly large, so I want to come up with a good system to cheaply store large datasets (mass forecasts, production, etc) and smaller datasets (forecast parameters, economic assumptions)


# Deal Based Data Model
Long term in the slopcast hub i want to develop other apps related to deal making, such as a progress tracker, bank book/teaser retrieval and storage system (along with AI enhancements for summaries). Foundational among these pieces is a model oriented around 'deals', which would be collections of wells (developed and undeveloped) with attached economic assumptions and global scenarios. For economic assumptions, it'd be stuff like cost profiles, production, ownership, etc; while global scenarios (as in the scenario-tab) are high level and deal with prices, rig schedules, federal taxes, etc. 

## Core Idea 
The fundamental unit for slopcast and its associates would be the 'deal' which consists of a collection of wells, economic assumptions for each well, and global scenario settings.

### Wells
Wells are the fundamental unit, slopcast would create its own unique ID for each well (like aries propnums but more descriptive). The ID would be generated based on developed vs undeveloped, date of creation, formation, and then maybe operator. Each well would store well level attributes that E&P companies commonly store like lateral length, D&C/POL dates, geography, reservoir characteristics, etc. 

Wells essentially form the immutable / core backbone of any potential deal or scenario, so a well's characteristics are hard coded, and then economic and scenario level parameters modify/calculate based on those characteristcs

### Economic Assumptions / Parameters
Already represented in the app as the group / curve assumptions with capex, production, ownership, etc. But the idea is that singular wells or groups of wells (undeveloped) can be assigned economic assumptions for their individual economics, that are later digested to calculate the scenario/deal-level econs.

An example would be, for undev, allocating 40 permian wells to a low capex, mid production profile with varying interests (based on lease) or diffs.

### Scenario parameters
For each deal, the user can run multiple scenarios for sensitivity analysis, such as capex / production multipliers, pricing, curtailment, development timing (how fast are wells drilled and how fast does spend occur). These scenarios would then be saved and attached to a deal, so that the user could review them later on, or compare them to actuals post the deal occuring

## Deal Objects themselves
Since deals bundle together an assortment of parameters, they'd also have metadata tied to them that the user selects, such as name, date, some category, etc. Deals would be stored in a central DB with the metadata for quick selection and analysis of prior deals.

Based on a user specified baseline scenario, the deal would be associated with KPIs like incremental reserves added, incremental PV10, offer price, and well count – among others. But in the UI the user could drill down and select associated scenarios and view their KPIs.

### Deal interaction
Post the deal being saved, the user could go back and edit economic and scenario assumptions and resave them, or have more granular sensitivities done such as dropping wells out of the deal (lowering density assumptions, or purchasing only a fraction of the PDP), changing interests/ownership, etc.

Deals in slopcast would be associated with economic cases, but across the application, they'd also be associated with ongoing deals described in the deal/task tracking app that's accessible in the main hub. That way slopcast cases can easily transfer to the task tracker so the workflow is more complete

# Integration with Slopcast-Backend
I developed 'slopcast-backend' to separately create an economic engine for this app and I want to integrate it with the main app to test it as a POC. However, I want the option to swap between the current system and the new system

## Notes about Slopcast-Backend
- Its entirely python based, meaning we probably need a fastAPI backend
- It has a test GUI to verify features, while I don't want to bring in the UI, in the stream (oil/gas/water) forecasting piece, I want to bring in the ag-grid / tabular forecast creation part alongside the keybinds like using combinations of shift, tab, ctrl, and arrow keys to mass edit all pieces of the forecast
- I want there to be a debug mode I can toggle that allows me to swap between the current tsx based system and the python based system
- Goal of implementing the backend is to use it as the basis for a data model that an AI agent works with and edit.
- 
# Profile System
I want to have a profile preset system where users can load in 'presets' of type curves / economic profiles. At a macro-level, presets would consist of type curves (large macro profiles), and are then broken down into sub-type curves (instantiations of the original curve but with regional adjustments, would be largely optional), and then constituent profiles for production, capex, LOE/OPEX, ownership, differentials/pricing, etc.

## UI Flow Ideas

### Pre-selection of profiles
At first pass, i think during the landing page the user should have a mechanism to query and select profiles before going into the granular analysis to avoid having to sift through a billion profiles for wells. This would be selected either by the AI search bar, or through manual user intervention, which would be toggleable. 

### Profiles in the well GUI
In the well/economic assumption GUI, the user would need to have the ability to assign the profiles to groups of wells. At the top level, they can apply a single type curve or sub type-curve to the group, but have the option to go in and either pick a specific profile for each component (prod, capex, etc) or individually adjust the assumptions for that component.

## Data model
The data model should be a unification of the current slopcast UI and the slopcast-backend model for easy testing. I'm debating whether to have separate tables for each component's forecast parameters (e.g. well_capex with only capex params, well_prod with only production params, etc) or have 1 unified table, but given the specificity of particular components its probably best to have multiple flexible tables.

Ideally the parameters are stored in a table (to save supabase storage) and then the historic forecast values (e.g. month by month production, capex, etc) are stored as parquets or in some cheaper storage.


# AI Assistant
Will flesh out later, the idea is that each app basically has a built in AI assistant the will edit widgets/inputs based on user prompts, so for slopcast, given a prompt, the AI would change relevant economic / scenario parameters

# UI/UX Tweaks
- Condense theme selection into a dropdown of sorts, but retain the emojis
- Allow multiple accordions to stay open / closed on the forecasting page