# AQUAFINA Salesforce Implementation

## Project Overview

This repository contains the configuration and documentation for the Salesforce implementation for AQUAFINA. The project aims to streamline AQUAFINA's sales service operations by leveraging Salesforce Sales Cloud. 

## Key Features

This section highlights the core functionalities delivered by the Salesforce implementation.

### Sales Cloud

The Sales Cloud configuration focuses on optimizing AQUAFINA's sales cycle, from lead generation to opportunity management and sales reporting.

* **User, Role, and Profile Management:** Configured to reflect AQUAFINA's sales structure, including sales representatives (France North/South, Spain West/East), Sales Order Department (France/Spain), and Sales Director. This ensures proper data ownership and visibility.
* **Lead Management:** Implementation of custom lead statuses (To contact, In progress, Qualified, Disqualified) with visual indicators to track lead progression.
* **Account and Contact Management:** Centralized management of distributors and restaurateurs, including specific pricing tiers.
* **Opportunity Management:** Defined opportunity stages (New, Quote Sent, Negotiation, Won, Lost) and differentiation between New Business and Repeat Business opportunities. Custom fields for Net Amount, VAT (20%), and Total Amount.
* **Product and Price Book Configuration:** Setup of AQUAFINA's bottled water products (individual, 5-pack, 10-pack) with distinct pricing for distributors and restaurateurs across regions.
* **Quote Generation:** Ability to generate professional quotes directly from opportunities, including automated VAT calculations.
* **Automated Logistics Notification:** A Salesforce Flow to automatically send delivery details (product list, client contact, address) to the Logistics Team upon order confirmation or specific opportunity stage.
* **Custom Lightning Web Component: `accountOpportunityManager`**
    * This component enhances the Account record page by providing a dynamic view of related Opportunities.
    * **Features:**
        * Displays a comprehensive list of opportunities linked to the current Account (Name, Stage, Close Date, Amount).
        * Enables **mass editing (inline editing)** of the 'Stage' and 'Close Date' fields for multiple opportunities directly within the list.
        * Includes a prominent "Save All" button, allowing users to **batch update** all modified opportunities with a single click via an efficient Apex method call.
        * Provides immediate user feedback through **toast messages** for successful save operations or any encountered errors.
* **Sales Dashboards and Reports:** Comprehensive dashboards providing real-time insights into:
    * Ongoing Leads
    * Ongoing Opportunities Pipeline (amount and count, by month, by stage)
    * Won Opportunities (Net Amount and count, by month)
    * Top 5 Products of the year
    * Top 5 Accounts of the year
