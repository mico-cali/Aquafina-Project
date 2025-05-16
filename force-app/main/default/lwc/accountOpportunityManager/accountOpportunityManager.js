import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Import Apex methods
import getOppsByAccountList from '@salesforce/apex/accountOpportunityManager.getOppsByAccountList';
import updateOpportunityList from '@salesforce/apex/accountOpportunityManager.updateOpportunityList';
import createOpportunityList from '@salesforce/apex/accountOpportunityManager.createOpportunityList';
import deleteOpportunityList from '@salesforce/apex/accountOpportunityManager.deleteOpportunityList'; 

export default class AccountOpportunityManager extends LightningElement {

    @api recordId; // Account ID from the record page
    @track opportunities = []; // Opportunities for the current account
    @track selectedOpportunities = []; // Current opportunities in modal
    @track draftValues = []; // Holds changes in mass edit datatable drafts

    @track showModal = false; // Controls modal visibility
    @track showDeleteConfirmModal = false; // For delete confirmation modal 

    @track isMassNewMode = false; // Track whether modal is for new or edit
    @track isMassMode = false; // To check if the editing, delete, create is for mass/many
    
    // incremental counter for temporary IDs on new records
    tempRowCounter = 0;
    // wiredOppsResult;

    // Datatable columns for main view
    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Stage', fieldName: 'StageName' },
        { label: 'Amount', fieldName: 'Amount', type: 'currency' },
        { label: 'Close Date', fieldName: 'CloseDate', type: 'date' }
    ];

    massCreateColumns = [
        { label: 'Name', fieldName: 'Name', editable: true },
        { label: 'Stage', fieldName: 'StageName' },
        { label: 'Close Date', fieldName: 'CloseDate', editable: true, type: 'date-local' }
    ];

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

    // Fetch opportunities
    @wire(getOppsByAccountList, { accId: '$recordId' })
    wiredOpps({ error, data }) {
        if (data) {
            // this.opportunities = data;
            
            // Assign tempId = Id for each existing opportunity for unique keys in datatable
            this.opportunities = data.map(opp => ({
                ...opp,
                tempId: opp.Id // Use Salesforce Id as tempId for existing records
            }));
        } else if (error) {
            this.showToast('Error loading opportunities', error.body.message, 'error');
        }
    }
    
    // temporary Id counter for mass create new opportunity
    generateTempId() {
        this.tempRowCounter++;
        return `temp-${this.tempRowCounter}`;
    }

    // Returns the modal title
    get modalTitle() {
        if (this.isMassNewMode) return 'Create New Opportunities';
        if (this.isMassMode) return 'Edit Selected Opportunities';
        return 'Edit Opportunity';
    }

    // Returns dynamic save button label
    get saveButtonLabel() {
        return this.isMassNewMode ? 'Create' : 'Update';
    }

    // Track selected rows in main datatable
    handleRowSelection(event) {
        this.selectedOpportunities = event.detail.selectedRows;
    }

    // Opens the modal for a new opportunity
    handleNew() {
        this.selectedOpportunities = [{ 
            tempId: this.generateTempId(), 
            Name: '', 
            StageName: 'New', // default new opportunity stage
            CloseDate: '' 
        }];

        this.isMassNewMode = true;
        this.isMassMode = false;
        this.draftValues =[]; // reset draft values
        this.showModal = true;
    }

    // Open modal to edit multiple lines
    handleEditSelected() {
        if (this.selectedOpportunities.length === 0) {
            return this.showToast('No rows selected', 'Please select at least one row for editing', 'error');
        }
        // To not directly edit the selected rows, clone them and use the clone as the main data
        this.selectedOpportunities = JSON.parse(JSON.stringify(this.selectedOpportunities));
        
        this.isMassNewMode = false;
        this.isMassMode = true;
        this.showModal = true;
    }   

    // Add new blank row in mass create modal
    handleAddRow() {
        const newRow = {
            tempId: this.generateTempId(), //  unique ID
            Name: '',
            StageName: 'New',
            CloseDate: '',
            AccountId: this.recordId
        };
        this.selectedOpportunities = [...this.selectedOpportunities, newRow];
    }

    // Handles draft changes in the mass edit datatable
    handleSaveDrafts(event) {
        const drafts = event.detail.draftValues;

        if(this.isMassNewMode) {
            let updatedSelectedOpps = JSON.parse(JSON.stringify(this.selectedOpportunities)); // Create a deep clone to ensure reactivity
    
            drafts.forEach(draft => {
                const index = updatedSelectedOpps.findIndex(opp => opp.tempId === draft.tempId);
                if (index !== -1) {
                    // Merge the draft changes into the existing opportunity object
                    Object.assign(updatedSelectedOpps[index], draft);
                }
            });
            this.selectedOpportunities = updatedSelectedOpps; // Update the reactive property
        } else if(this.isMassMode) {
            this.draftValues = [...this.draftValues, ...drafts]; 

            let updatedSelectedOpps = JSON.parse(JSON.stringify(this.selectedOpportunities)); 
            drafts.forEach(draft => {
                const index = updatedSelectedOpps.findIndex(opp => opp.Id === draft.Id);
                if (index !== -1) {
                    // Merge the draft changes into the existing opportunity object
                    Object.assign(updatedSelectedOpps[index], draft);
                }
            });
            this.selectedOpportunities = updatedSelectedOpps; // Update the reactive property
        }
        
        // Clear draft values 
        this.draftValues = [];
    }

    // Handles edit input changes for the mass edit opportunity
    handleModalInputChange(event) {
        const { id } = event.target.dataset;   // The Id of the opportunity being edited
        const fieldName = event.target.name;  // The field that changed
        const value = event.detail.value;    

        // Use map to create a new array with the updated opportunity
        this.selectedOpportunities = this.selectedOpportunities.map(opp => {
            if (opp.Id === id) {
                // If this is the opportunity that changed, create a new object
                // with the updated field value.
                return { ...opp, [fieldName]: value };
            }

            return opp;
        });
    }

    // Validates the current opportunities in the new creation before saving
    validateOpportunity() {
        for(const opp of this.selectedOpportunities) {
            if(!opp.Name || opp.Name.trim() === '') {
                this.showToast('Validation Error', 'Opportunity Name is required.', 'error');
                return false;
            }
            if(!opp.StageName || opp.StageName.trim() === '') {
                this.showToast('Validation Error', 'Stage is required.', 'error');
                return false;
            }
            if(!opp.CloseDate) {
                this.showToast('Validation Error', 'Close Date is required.', 'error');
                return false;
            }
        }
        return true;
    }

    // Save the current list of opportunities
    saveOpportunity() {
        if(this.isMassNewMode) {
            // Validate first before saving
            if(!this.validateOpportunity()) {
                return;
            }

            // const newOpps = this.selectedOpportunities.map(({ tempId, ...rest }) => ({ ...rest, AccountId: this.recordId }));
            // destructured style
            const newOpps = this.selectedOpportunities.map(opp => {
                const { tempId, ...rest } = opp; // Destructure to exclude tempId
                return { ...rest, AccountId: this.recordId }; // Add AccountId
            });

            createOpportunityList({ oppListData: newOpps })
                .then(() => {
                    this.showToast('Success', 'Opportunities created successfully.', 'success');
                    this.closeModal();
                    return this.refreshList();
                })
                .catch(error => {
                    this.showToast('Error creating opportunities', error.body.message, 'error');
                });
        } else if (this.isMassMode) {
            updateOpportunityList({ opportunities: this.selectedOpportunities })
                .then(() => {
                    this.showToast('Success', 'Opportunities updated successfully.', 'success');
                    this.closeModal();
                    return this.refreshList();
                })
                .catch(error => {
                    this.showToast('Error updating opportunities', error.body.message, 'error');
                });
        }
    }

    // validation if there is/are selected rows for deletion
    confirmDelete() {
        if(this.selectedOpportunities.length === 0) {
            this.showToast('No rows selected', 'Please select at least one row for deleting', 'error');
            return;
        }
        this.showDeleteConfirmModal = true; 
    }

    // Closes the delete confirmation modal
    closeDeleteConfirmModal() {
        this.showDeleteConfirmModal = false;
    }

    deleteConfirmed() {
        const deleteIds = this.selectedOpportunities.map(opp => opp.Id);
        deleteOpportunityList({ oppIds: deleteIds })
        .then(() => {
            this.showToast('Deleted', 'Opportunities deleted successfully', 'success');
            // return getOppsByAccountList({ accId: this.recordId }); //also the refresh function
            this.showDeleteConfirmModal = false;
            this.selectedOpportunities = [];
            return this.refreshList();
        })
        .catch(error => {
            this.showToast('Error deleting opportunities', error.body.message, 'error');
        });
    }

    // Closes the modal
    closeModal() {
        this.showModal = false;
        this.selectedOpportunities = []; // reset selected opportunities
        this.draftValues = []; //reset
        this.isMassNewMode = false;
        this.isMassMode = false;
    }

    refreshList() {
        return getOppsByAccountList({ accId: this.recordId })
            .then(data => {
                this.opportunities = data;
                this.selectedOpportunities = [];
                this.draftValues = [];
            })
            .catch(error => {
                this.showToast('Error refreshing opportunities', error.body.message, 'error');
            });
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
}