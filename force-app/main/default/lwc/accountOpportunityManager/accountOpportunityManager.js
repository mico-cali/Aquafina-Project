import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Import Apex methods
import getOppsByAccountList from '@salesforce/apex/accountOpportunityManager.getOppsByAccountList';
import updateOpportunityList from '@salesforce/apex/accountOpportunityManager.updateOpportunityList';

export default class AccountOpportunityManager extends LightningElement {
    // The recordId will be auto-passed when used in record page
    @api recordId;

    // All related opportunities for the Account
    @track opportunities = [];

    // Holds the currently selected opportunity being edited in the modal
    @track selectedOpportunity = {};

    // Controls visibility of modal
    @track showModal = false;

    // Fetch opportunities related to the current Account
    @wire(getOppsByAccountList, { accId: '$recordId' })
    wiredOpps({ error, data }) {
        if (data) {
            this.opportunities = data;
        } else if (error) {
            this.showToast('Error loading opportunities', error.body.message, 'error');
        }
    }

    // Stage Options
    get stageOptions() {
        return [
            {value: 'New', label: 'New'},
            {value: 'Quote Sent', label: 'Quote Sent'},
            {value: 'Negotiation', label: 'Negotiation'},
            {value: 'Closed Won', label: 'Closed Won'},
            {value: 'Closed Lost', label: 'Closed Lost'}
        ];
    }

    // Called when user clicks the Edit action button
    handleEdit(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'edit') {
            // Create a copy of the selected opportunity to avoid directly mutating the list
            this.selectedOpportunity = { ...row };
            this.showModal = true;
        }
    }

    // Called when a field value is changed inside the modal
    handleFieldChange(event) {
        const fieldName = event.target.name;
        const value = event.target.value;

        // Update the local selectedOpportunity object with the new value
        this.selectedOpportunity[fieldName] = value;
    }

    // Close the modal and reset selected opportunity
    closeModal() {
        this.showModal = false;
        this.selectedOpportunity = {};
    }

    // Called when the Save button is clicked in the modal
    saveOpportunity() {
        // Make sure the Id is present and wrap it in a list to send to Apex
        if (this.selectedOpportunity.Id) {
            updateOpportunityList({ opportunities: [this.selectedOpportunity] })
                .then(() => {
                    this.showToast('Success', 'Opportunity updated successfully', 'success');
                    this.showModal = false;
                    this.selectedOpportunity = {};

                    // Refresh the list of opportunities
                    return getOppsByAccountList({ accId: this.recordId });
                })
                .then(result => {
                    this.opportunities = result;
                })
                .catch(error => {
                    this.showToast('Error updating opportunities', error.body.message, 'error');
                });
        } else {
            this.showToast('Error', 'No Opportunity selected for update', 'error');
        }
    }

    // Utility function to show toast messages
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }

    // DataTable column configuration with action for Edit
    get columns() {
        return [
            { label: 'Name', fieldName: 'Name' },
            { label: 'Stage', fieldName: 'StageName' },
            { label: 'Close Date', fieldName: 'CloseDate' },
            { label: 'Amount', fieldName: 'Amount', type: 'currency' },
            {
                type: 'action',
                typeAttributes: {
                    rowActions: [
                        { label: 'Edit', name: 'edit' }
                    ]
                }
            }
        ];
    }
}
