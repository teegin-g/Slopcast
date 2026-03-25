# AC_PROPERTY

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".ac_property` |
| **Title** | Aries EG Property Table (Master) |
| **Alias** | N/A |
| **Column Count** | 152 |

## Description

Aries well header and property attribute table. In the application user interface, this is the Aries Master Table (well header), containing property information and data.

## Key Fields


| Key Type | Fields | Description |
|----------|--------|-------------|
| **Primary Key** | `propnum` | Unique well identifier |

## Column Reference

| Column | Data Type | Title | Description |
|--------|-----------|-------|-------------|
| `abstract` | `varchar(50)` | Aries EG Abstract | For states that have abstract in their land grid (ex. Texas), the surface hole i... |
| `acquisition` | `varchar(100)` | Aries EG Acquisition | The purchase/acquiring of additional oil and gas assets to create additional sha... |
| `acres` | `int` | Aries EG Acres | The number of net acres in a spacing unit. |
| `afe_capex` | `double` | Aries EG AFE Capex | Total estimated approved cost for drilling and completion of a well. |
| `afe_cmp_cost` | `double` | Aries EG AFE CMP Cost | Total estimated approved cost for completion of a well (in thousands). |
| `afe_drl_cost` | `double` | Aries EG AFE DRL Cost | Total estimated approved cost for drilling of a well (in thousands). |
| `afe_eqp_cost` | `double` | Aries EG AFE EQP Cost | Total estimated approved cost for facility building of a well (in thousands). |
| `alias` | `varchar(100)` | Aries EG Operator Alias | See related term. |
| `alternate_id` | `varchar(50)` | Aries EG Alternate Id | Usually the regulatory identifier from the state. |
| `aoi` | `varchar(50)` | Aries EG AOI | Area of interest usually based on eGIS outlines. It can, also, be referred to as... |
| `api` | `varchar(10)` | Aries EG API10 | See related term. |
| `area` | `varchar(15)` | Aries EG Area | See related term. |
| `asset_team` | `varchar(50)` | Aries EG Asset Team | See related term. |
| `battery` | `varchar(50)` | Aries EG Battery | Central tank battery associated with the well. |
| `bh_abstract` | `varchar(50)` | Aries EG BH Abstract | For states that have abstract in their land grid (ex. Texas), the bottom hole is... |
| `bh_block` | `varchar(50)` | Aries EG BH Block | For states that have blocks in their land grid (ex. Texas), the bottom hole is l... |
| `bh_latitude` | `double` | Aries EG BH Latitude | Geographical location of the end of the well; the angular distance of a place ea... |
| `bh_location` | `varchar(75)` | Aries EG BH Location | Legal location of bottom hole (Format: TWN/RNG/SEC) |
| `bh_longitude` | `double` | Aries EG BH Longitude | Geographical location of the end of the well; the angular distance of a place ea... |
| `bh_survey` | `varchar(50)` | Aries EG BH Survey | For states that have surveys in their land grid (ex. Texas), the bottom hole is ... |
| `big_rig_start_date` | `timestamp` | Aries EG Big Rig Start Date | Date drilling begins in the vertical. |
| `block` | `varchar(50)` | Aries EG Block | For states that have blocks in their land grid (ex. Texas), the surface hole is ... |
| `booked_capex` | `double` | Aries EG Booked Capex | Total final booked/invoiced cost for drilling and completion of a well. |
| `booked_cmp_cost` | `double` | Aries EG Booked CMP Cost | Total final booked/invoiced cost for completion of a well. |
| `booked_drl_cost` | `double` | Aries EG Booked DRL Cost | Total final booked/invoiced cost for drilling of a well. |
| `booked_eqp_cost` | `double` | Aries EG Booked EQP Cost | Total final booked/invoiced cost for facility building of a well. |
| `btu` | `double` | Aries EG BTU | Measurement that stands for British thermal units. British thermal unit (Btu) is... |
| `change_date` | `timestamp` | Aries EG Change Date | Resource Development/Corporate Reserves internally used field. Updated with the ... |
| `clusters_stage` | `int` | Aries EG Clusters Stage | Clusters per stage is defined as the number of perforation guns used per fractur... |
| `co2_gas_pct` | `decimal(18,8)` | Aries EG CO2 GAS PCT | Percent of CO2 found in the gas. |
| `comment` | `varchar(255)` | Aries EG Comment | Resource Development/Corporate Reserves internally used field. Updated as needed... |
| `completion_date` | `timestamp` | Aries EG Completion Date | Date when a well has completed the stimulation job, and has cleaned out the well... |
| `confidence` | `varchar(45)` | Aries EG Confidence | Resource Development/Corporate Reserves internally used field. Confidence level ... |
| `corecostcenter` | `varchar(100)` | Aries EG CoreCostCenter | An organizational unit within a controlling area that represents a defined locat... |
| `costcenter` | `varchar(100)` | Aries EG CostCenter | An organizational unit within a controlling area that represents a defined locat... |
| `cost_date` | `timestamp` | Aries EG Cost Date | Not consistently used; generally the date in which the Cost Profile lookup table... |
| `cost_profile` | `varchar(255)` | Aries EG Cost Profile | Well profile based on prospect, target formation, lateral length and casing desi... |
| `country` | `varchar(30)` | Aries EG Country | The country location where the surface hole is located. |
| `county` | `varchar(40)` | Aries EG County | The county location where the surface hole is located. |
| `datatrade` | `varchar(1)` | Aries EG Data Trade | An entity that consists of a producing hydro carbons and the data associated wit... |
| `datum` | `varchar(6)` | Datum |  |
| `dbskey` | `varchar(12)` | Aries EG DBS Key | DBS Key is a system generated key from Aries. |
| `density` | `varchar(25)` | Aries EG Density | Mass per unit of volume. Density is typically reported in g/cm3 (for example, ro... |
| `description` | `varchar(255)` | Aries EG Description | Resource Development/Corporate Reserves internally used field. Updated as needed... |
| `development_group` | `varchar(255)` | Aries EG Development Group | Resource Development/Corporate Reserves internally used field. For portfolio. |
| `development_stage` | `varchar(255)` | Aries EG Development Stage | Resource Development/Corporate Reserves internally used field. As of 12/2024, th... |
| `disposition` | `varchar(255)` | Aries EG Disposition | 4-digit year well is disposed (ex. Sold). |
| `district` | `varchar(50)` | Aries EG District | See related term. |
| `dmin_gas` | `float` | Aries EG Dmin Gas | Decline minimum for gas. |
| `dmin_oil` | `float` | Aries EG Dmin Oil | Decline minimum for oil. |
| `dmin_wtr` | `float` | Aries EG Dmin Wtr | Decline minimum for water. |
| `dso_well_design` | `varchar(50)` | Aries EG DSO Well Design | Used to match well design in DSO to facilitate budget capex updates. |
| `eia23countycode` | `varchar(50)` | Aries EG County Code | From API - 3rd-5th digits. For Corporate Reserves Reporting. |
| `eia23statecode` | `varchar(50)` | Aries EG State Code | From API - 1st-2nd digits. For Corporate Reserves Reporting. |
| `eia23subcode` | `varchar(50)` | Aries EG Sub Code | Not populated. For Corporate Reserves Reporting. |
| `eia23typecode` | `varchar(50)` | Aries EG Type Code | Ex: LP, Shale, Coal. For Corporate Reserves Reporting. |
| `election_date` | `timestamp` | Aries EG Election Date | Date signed AFE is sent to operating partner. |
| `engineer` | `varchar(50)` | Aries EG Engineer | The Resource Development Engineer responsible for the well. |
| `expl_dev` | `varchar(4)` | Aries EG EXPL or DEV | Exploratory or Development well designation. This will likely be determined by a... |
| `extension_year` | `float` | Aries EG Extension Year | Year well becomes proved reserve; OSO may use for well that produced but we didn... |
| `federal` | `varchar(50)` | Aries EG Federal | If well is on a federal lease. |
| `first_prod` | `timestamp` | Aries EG First Prod | First date of Production Well Status = Producing; put on permanent wellhead prod... |
| `fka_propnum` | `varchar(12)` | Aries EG FKA Propnum | The Aries Property Number (PROPNUM) formerly associated with the well. |
| `fka_well_name` | `varchar(100)` | Aries EG FKA Wellname | See related term. |
| `fluid_type` | `varchar(50)` | Aries EG Fluid Type | A fluid injected into a well as part of a stimulation operation. Fracturing flui... |
| `formation` | `varchar(100)` | Aries EG Formation | See related term. This reflects the producing formation. |
| `gas_comp_station` | `varchar(100)` | Aries EG Gas Comp Station | Gas compressor station. May not be updated regularly. |
| `gas_contract` | `varchar(25)` | Aries EG Gas Contract | Gas contract(s) number(s). May not be updated regularly. |
| `gas_diff_add` | `float` | Aries EG Gas Diff Add | Gas differential $ amount to add or subtract. Can be used internally by Resource... |
| `gas_diff_pcnt` | `float` | Aries EG Gas Diff Pct | Gas differential percent. Can be used internally by Resource Development/Corpora... |
| `gas_gatherer` | `varchar(100)` | Aries EG Gas Gatherer | Gas gathering company. Asset teams are currently manually updating this - update... |
| `gas_grav` | `float` | Aries EG Gas Gravity | Gas gravity of well |
| `gas_plant` | `varchar(100)` | Aries EG Gas Plant | Location of gas plant. May not be updated regularly. |
| `grp` | `varchar(50)` | Aries EG Group | 10k Grouping for SEC |
| `h2s_gas_pct` | `decimal(18,8)` | Aries EG H2S Gas Pct | Percent of H2S in gas |
| `h2s_oil_pct` | `decimal(18,8)` | Aries EG H2S Oil Pct | Percent of H2S in oil |
| `heel_call_e_w` | `varchar(10)` | Aries EG Heel Call E_W | Distance (in feet) of the well's heel location from the east or west line of the... |
| `heel_call_n_s` | `varchar(10)` | Aries EG Heel Call N_S | Distance (in feet) of the well's heel location from the north or south line of t... |
| `heel_latitude` | `double` | Aries EG Heel Latitude | The latitude of the heel of the wellbore. The heel is the point at which the wel... |
| `heel_location` | `varchar(75)` | Aries EG Heel Location | The location of the heel of the wellbore. The heel is the point at which the wel... |
| `heel_longitude` | `double` | Aries EG Heel Longitude | The longitude of the heel of the wellbore. The heel is the point at which the we... |
| `infill` | `varchar(40)` | Aries EG Infill | Used to indicate if this well is an Infill or Grassroots or Parent with Children... |
| `jv` | `varchar(255)` | Aries EG JV | This field should be populated with the entity that we have the JV agreement wit... |
| `jv_nri_gas` | `decimal(18,8)` | Aries EG JV NRI Gas | Refers to the Joint Venture Net Revenue Interest for gas. This field is not cons... |
| `jv_nri_oil` | `decimal(18,8)` | Aries EG JV NRI Oil | Refers to the Joint Venture Net Revenue Interest for oil. This field is not cons... |
| `jv_wi` | `decimal(18,8)` | Aries EG JV WI | Refers to the Joint Venture Working Interest. This field is not consistently upd... |
| `land_initiate` | `varchar(1)` | Aries EG Land Initiate | The Aries Land Initiate field is a flag used to identify wells that need to be i... |
| `lateral_length` | `int` | Aries EG Lateral Length | See related terms.This field is updated in four stages for both OP and NONOP:Pri... |
| `location_status` | `varchar(15)` | Aries EG Location Status | Field used to describe the phase of the location info. (Block Diagram, Platted, ... |
| `loe` | `double` | Aries EG LOE | Lease operating expense per month.Well StatusLOE FieldPrior to ProducingIs not p... |
| `lower_perf` | `double` | Aries EG Lower Perf | Perforated Bottom Depth (Well Level) |
| `major` | `varchar(3)` | Aries EG Major | This would be the type of hydrocarbon that is more than 50%+ of the associated f... |
| `manager` | `varchar(50)` | Aries EG Manager | The Resource Development Manager responsible for the well. |
| `md` | `int` | Aries EG MD | See related term.This field is updated in two phases for both OP and NONOP:Upon ... |
| `ngl_yield` | `double` | Aries EG NGL Yield | Not updated |
| `npc` | `varchar(10)` | Aries EG NPC | The code associated with various types of partification in royalty interest. |
| `nri_apo_gas` | `decimal(18,8)` | Aries EG NRI APO Gas | Net revenue interest after payout for gas |
| `nri_apo_oil` | `decimal(18,8)` | Aries EG NRI APO Oil | Net revenue interest after payout for oil |
| `nri_bpo_gas` | `decimal(18,8)` | Aries EG NRI BPO GAS | Net revenue interest before payout for gas |
| `nri_bpo_oil` | `decimal(18,8)` | Aries EG NRI BPO OIL | Net revenue interest before payout for oil |
| `off_unit_sh` | `varchar(75)` | Aries EG Off Unit SH | Off unit surface hole; SH is off section; Currently being used for the block dia... |
| `oil_contract` | `varchar(25)` | Aries EG Oil Contract | This field is not currently being used. Once used to hold oil contract numbers t... |
| `oil_diff_add` | `float` | Aries EG Oil Diff Add | Oil differential $ amount to add or subtract. Can be used internally by Resource... |
| `oil_diff_pcnt` | `float` | Aries EG Oil Diff Pct | Oil differential percent. Can be used internally by Resource Development/Corpora... |
| `oil_gatherer` | `varchar(100)` | Aries EG Oil Gatherer | The primary entity responsible for gathering/hauling the oil off of location for... |
| `oil_grav` | `float` | Aries EG Oil Gravity | Not consistently used. |
| `opc_gas` | `double` | Aries EG OPC Gas | The operating cost per mcf of gas.Well StatusLOE FieldPrior to ProducingIs not p... |
| `opc_oil` | `double` | Aries EG OPC Oil | The operating cost per barrel of oil.Well StatusLOE FieldPrior to ProducingIs no... |
| `opc_water` | `double` | Aries EG OPC Water | The operating cost per barrel of water.Well StatusLOE FieldPrior to ProducingIs ... |
| `operator` | `varchar(48)` | Aries EG Operator | See related term. |
| `op_nonop` | `varchar(5)` | Aries EG Op Nonop | See related term. |
| `orri` | `decimal(18,8)` | Aries EG ORRI | A non-cost bearing and Non-Operating Interest carved out of a Working Interest t... |
| `other_prop_per` | `double` | Aries EG Other Prop Per | Other proppant used in completion job |
| `pad` | `varchar(255)` | Aries EG Pad | Name of pad where well is located; same as the sitename in DSO |
| `payout` | `double` | Aries EG Payout | Not consistently used; for the Powder River Basin Dominion Project, this field r... |
| `phase_window` | `varchar(25)` | Aries EG Phase Window | The primary phase/major of a reservoir domain. |
| `plat_received` | `timestamp` | Aries EG Plat Received | The data of the latest plat received from right of way. |
| `play` | `varchar(100)` | Aries EG Play | This is being decomissioned and no longer updated. |
| `prior_gas` | `double` | Aries EG Prior Gas | Not populated - Prior gas if well was acquired |
| `prior_oil` | `double` | Aries EG Prior Oil | Not populated - Prior oil if well was acquired |
| `prior_wtr` | `double` | Aries EG Prior Water | Not populated - Prior water if well was acquired |
| `prod_status_date` | `timestamp` | Aries EG Prod Status Date | First date of Production Well Status = Producing; put on permanent wellhead prod... |
| `prod_typecurve` | `varchar(50)` | Aries EG Prod Typecurve | Identifies type curve associated with well the well. The curve name must match t... |
| `producing_method` | `varchar(40)` | Aries EG Producing Method | The Producing Method describes how a well is producing hydrocarbons. To ensure t... |
| `proj_big_rig_start` | `timestamp` | Aries EG Proj Big Rig Start | Estimated start date based upon the published DSO schedule in which the big rig ... |
| `project` | `varchar(50)` | Aries EG Project | See related term. |
| `proj_rig_release` | `timestamp` | Aries EG Proj Rig Release | Estimated date based upon the published DSO schedule in which the drilling rig w... |
| `proj_spud_date` | `timestamp` | Aries EG Project Spud Date | Estimated date based upon the published DSO schedule in which the spudder rig or... |
| `proj_stim_date` | `timestamp` | Aries EG Proj Stim Date | Estimated date based upon the published DSO schedule in which the stim ops will ... |
| `propnum` | `varchar(12)` | Aries EG Propnum | The Aries property number is the unique identifier for the Aries database that i... |
| `proposal_rec_date` | `timestamp` | Aries EG Proposal Rec Date | The date the proposal was received. OSO tracks how many proposals received per w... |
| `prospect` | `varchar(50)` | Aries EG Prospect | An area of exploration in which hydrocarbons have been predicted to exist in eco... |
| `pud_must_spud` | `smallint` | Aries EG Pud Must Spud | The date the PUD (proved undeveloped well) must spud by, per SEC rules. |
| `range1` | `varchar(10)` | Aries EG Range 1 | For states that have ranges in their land grid, the wellbore goes through this s... |
| `range2` | `varchar(10)` | Aries EG Range 2 | For states that have ranges in their land grid, the wellbore goes through this s... |
| `range3` | `varchar(10)` | Aries EG Range 3 | For states that have ranges in their land grid, the wellbore goes through this s... |
| `range4` | `varchar(10)` | Aries EG Range 4 | For states that have ranges in their land grid, the wellbore goes through this s... |
| `rcc` | `varchar(5)` | Aries EG RCC | See related term. |
| `rec_catname` | `varchar(50)` | Aries EG Rec Catname | EXTENSION, ACQUISITION, or DIVESTITURE (formerly DISPOSITION). From Cheryl Pettu... |
| `rec_changedate` | `timestamp` | Aries EG Rec Changedate | Date that REC_CATNAME field is changed. Used internally in RD/Corporate Reserves... |
| `recomp_afe` | `double` | Aries EG Recomp AFE | Recompletion AFE (in thousands) |
| `recomp_booked_afe` | `double` | Aries EG Recomp Booked AFE | Recompletion Booked AFE Cost (in thousands) |
| `recomp_date` | `timestamp` | Aries EG Recomp Date | The date in which production begins after the recompletion/refrac job ends. |
| `res_domain_typecurve` | `varchar(55)` | Aries EG Res Domain Typecurve | A Production profile for an area with similar geological features used to analyz... |
| `reservoir` | `varchar(100)` | Aries EG Reservoir | See related term. |
| `reservoir_domain` | `varchar(50)` | Aries EG Reservoir Domain | See related term. |
| `rig_name` | `varchar(50)` | Aries EG Rig Name | Name and number of rig that drilled the well. |
| `rig_release_date` | `timestamp` | Aries EG Rig Release Date | Date that the rig is released from the wellbore after reaching total depth and d... |
| `route` | `varchar(100)` | Aries EG Route | The set of wells that an operator (aka pumper) is in charge of maintaining. One ... |
| `rsv_cat` | `varchar(20)` | Aries EG RSV Cat | See related term. |
| `rsv_class` | `varchar(12)` | Aries EG RSV Class | Describes divisions of wells by their likelihood of success. For example, Proved... |
| `sap_nri_gas` | `decimal(18,8)` | Aries EG SAP NRI Gas | NRI is the portion of production remaining after deducting related burdens (e.g.... |

## Relationships


This is the **master table** that other tables reference.

| Related Table | Relationship | Join Key |
|---------------|--------------|----------|
| AC_MONTHLY | One-to-Many | `propnum` |
| AC_ONELINE | One-to-Many | `propnum` |
| AC_ECONOMIC | One-to-Many | `propnum` |
| AC_PRODUCT | One-to-Many | `propnum` |
| CLR_ALTERNATE_INFO | One-to-One | `propnum` |
| CLR_DSO_INFO | One-to-One | `propnum` |
| CLR_ATTRIBUTE | One-to-One | `propnum` |

### Example Query

```sql
SELECT
    p.propnum, p.well_name, p.asset_team, p.formation,
    p.wi, p.nri_bpo_oil, p.nri_bpo_gas
FROM epw.aries_evergreen.ac_property p
WHERE p.asset_team = 'PRB'
  AND p.rsv_cat = 'PDP'
```
