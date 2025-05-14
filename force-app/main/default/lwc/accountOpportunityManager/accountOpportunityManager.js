import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Import Apex methods
import getOppsByAccountList from '@salesforce/apex/accountOpportunityManager.getOppsByAccountList';
import updateOpportunityList from '@salesforce/apex/accountOpportunityManager.updateOpportunityList';
import createOpportunity from '@salesforce/apex/accountOpportunityManager.createOpportunity';
import deleteOpportunityList from '@salesforce/apex/accountOpportunityManager.deleteOpportunityList';

export default class AccountOpportunityManager extends LightningElement {

    @api recordId; // Account ID from the record page
    @track opportunities = []; // Opportunities for the current account
    @track selectedOpportunity = {}; // Current opportunity in modal
    @track showModal = false; // Controls modal visibility
    @track isNew = false; // Track whether modal is for new or edit

    // Fetch opportunities
    @wire(getOppsByAccountList, { accId: '$recordId' })
    wiredOpps({ error, data }) {
        if (data) {
            this.opportunities = data;
        } else if (error) {
            this.showToast('Error loading opportunities', error.body.message, 'error');
        }
    }

    // Stage picklist options
    get stageOptions() {
        return [
            { value: 'New', label: 'New' },
            { value: 'Quote Sent', label: 'Quote Sent' },
            { value: 'Negotiation', label: 'Negotiation' },
            { value: 'Closed Won', label: 'Closed Won' },
            { value: 'Closed Lost', label: 'Closed Lost' }
        ];
    }

    // Returns the modal title
    get modalTitle() {
        return this.isNew ? 'New Opportunity' : 'Edit Opportunity';
    }

    // Returns dynamic save button label
    get saveButtonLabel() {
        return this.isNew ? 'Create' : 'Update';
    }

    // Opens the modal for a new opportunity
    handleNew() {
        this.selectedOpportunity = {
            Name: '',
            StageName: 'New',
            CloseDate: '',
            AccountId: this.recordId
        };
        this.isNew = true;
        this.showModal = true;
    }

    // Opens the modal for editing
    handleEdit(event) {
        const row = event.detail.row;
        this.selectedOpportunity = { ...row }; // Clone to avoid reference issues
        this.isNew = false;
        this.showModal = true;
    }

    // Delete an opportunity
    handleDelete(event) {
        const row = event.detail.row;
        deleteOpportunityList({ oppIds: [row.Id] })
            .then(() => {
                this.showToast('Deleted', 'Opportunity deleted successfully', 'success');
                return getOppsByAccountList({ accId: this.recordId });
            })
            .then(result => {
                this.opportunities = result;
            })
            .catch(error => {
                this.showToast('Error deleting opportunity', error.body.message, 'error');
            });
    }

    // Handles value change in modal inputs
    handleFieldChange(event) {
        const fieldName = event.target.name;
        const value = event.target.value;
        this.selectedOpportunity[fieldName] = value;
    }

    // Closes the modal
    closeModal() {
        this.showModal = false;
        this.selectedOpportunity = {};
    }

    // Save the opportunity (new or updated)
    saveOpportunity() {
        if (this.isNew) {
            createOpportunity({ oppData: this.selectedOpportunity })
                .then(() => {
                    this.showToast('Created', 'Opportunity created successfully', 'success');
                    return getOppsByAccountList({ accId: this.recordId });
                })
                .then(result => {
                    this.opportunities = result;
                })
                .catch(error => {
                    this.showToast('Error creating opportunity', error.body.message, 'error');
                });
        } else {
            updateOpportunityList({ opportunities: [this.selectedOpportunity] })
                .then(() => {
                    this.showToast('Updated', 'Opportunity updated successfully', 'success');
                    return getOppsByAccountList({ accId: this.recordId });
                })
                .then(result => {
                    this.opportunities = result;
                })
                .catch(error => {
                    this.showToast('Error updating opportunity', error.body.message, 'error');
                });
        }

        this.closeModal();
    }

    // Shows toast messages
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    // Handle datatable row actions
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        if (actionName === 'edit') {
            this.handleEdit(event);
        } else if (actionName === 'delete') {
            this.handleDelete(event);
        }
    }

    // Column definitions for datatable
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
                        { label: 'Edit', name: 'edit' },
                        { label: 'Delete', name: 'delete' }
                    ]
                }
            }
        ];
    }
}