import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Import Apex methods
import getOppsByAccountList from '@salesforce/apex/accountOpportunityManager.getOppsByAccountList';
import updateOpportunityList from '@salesforce/apex/accountOpportunityManager.updateOpportunityList';
import createOpportunityList from '@salesforce/apex/accountOpportunityManager.createOpportunityList';
import deleteOpportunityList from '@salesforce/apex/accountOpportunityManager.deleteOpportunityList'; 
import CloseDate from '@salesforce/schema/Opportunity.CloseDate';

export default class AccountOpportunityManager extends LightningElement {

    @api recordId; // Account ID from the record page
    @track opportunities = []; // Opportunities for the current account
    @track selectedOpportunities = []; // Current opportunities in modal

    @track showModal = false; // Controls modal visibility
    @track showDeleteConfirmModal = false; // For delete confirmation modal 

    @track isMassNewMode = false; // Track whether modal is for new or edit
    @track isMassMode = false; // To check if the editing, delete, create is for mass/many
    
    // Incremental counter for temporary IDs on new records
    tempRowCounter = 0;

    // Datatable columns for main view
    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Stage', fieldName: 'StageName' },
        { label: 'Amount', fieldName: 'Amount', type: 'currency' },
        { label: 'Close Date', fieldName: 'CloseDate', type: 'date' }
    ];

    // For staging datatable for create opportunity
    massCreateColumns = [
        { label: 'Name', fieldName: 'Name'},
        { label: 'Stage', fieldName: 'StageName'},
        { label: 'Amount', fieldName: 'Amount', type: 'currency'},
        { label: 'Close Date', fieldName: 'CloseDate', type: 'date' },
        {
            label: 'Action',
            type: 'button',
            typeAttributes: {
                label: 'Delete',
                name: 'delete',
                title: 'Delete Row',
                iconName: 'utility:delete',
                variant: 'destructive',
                iconClass: 'slds-icon_x-small'
            }
        }
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
        return this.isMassNewMode ? 'Save All' : 'Update';
    }

    // Track selected rows in main datatable
    handleRowSelection(event) {
        this.selectedOpportunities = event.detail.selectedRows;
    }

    // ----------------------------------- NEW OPPORTUNITY -----------------------------------
    // Add new blank row in mass create modal
    newOpportunities = [];
    newOppName = '';
    newOppStage = '';
    newOppAmount = 0;
    newOppCloseDate;

    // edit staging array value
    editOpportunities = [];

    // this will get what the user input on the name, stage, closedate
    handleModalInputChange(event) {
        const fieldName = event.target.name;
        const value = event.target.value;
        
        if(this.isMassMode) {
            const oppId = event.target.dataset.id;
            // Assign value to each selected row for editing
            this.editOpportunities = this.editOpportunities.map(opp => {
                if (opp.Id === oppId) {
                    return { ...opp, [fieldName]: value };
                }
                return opp;
            });
        } else if(this.isMassNewMode) {
            this[event.target.name] = event.target.value;
        }
    }

    // Opens the modal for a new opportunity
    handleNew() {
        this.newOpportunities = [];
        this.isMassNewMode = true;
        this.isMassMode = false;
        this.showModal = true;
    }

    // This is for adding values to the overview datatable before saving/inserting to the database
    handleAdd() {
        // validation for inputs
        if (!this.newOppName || this.newOppName.trim() === '') {
            this.showToast('Validation Error', 'Opportunity Name is required.', 'error');
            return;
        }
        if(!this.newOppStage  || this.newOppStage.trim() === '') {
            this.showToast('Validation Error', 'Stage is required.', 'error');
            return;
        }
        if(!this.newOppCloseDate) {
            this.showToast('Validation Error', 'Close Date is required.', 'error');
            return;
        }

        const newOppDraft = {
            tempId: this.generateTempId(),
            Name: this.newOppName,
            StageName: this.newOppStage,
            Amount: this.newOppAmount,
            CloseDate: this.newOppCloseDate,
            AccountId: this.recordId
        };
        this.newOpportunities = [...this.newOpportunities, newOppDraft];
        this.clearInputFields();
    }

    // This will now be called when the save button is clicked in the mass edit modal
    handleSaveAll() {
        if(this.isMassNewMode) {
            this.handleCreateNewOpportunities();    
        } else if(this.isMassMode) {
            this.handleUpdateOpportunities();
        }
    }

    // This is for adding/creating new opportunities which will call the apex class function for create opportunity
    handleCreateNewOpportunities() {
        if(!this.validateOpportunity) {
            return;
        }

        // convert to JSON string
        const newOppJSONStr = JSON.stringify(this.newOpportunities);
        createOpportunityList({ newOppJSONListData: newOppJSONStr }) 
            .then(() => {
                this.showToast('Success', 'Opportunities created successfully', 'success');
                this.closeModal();
                this.refreshList();
            })
            .catch(error => {
                this.showToast('Error creating opportunities', error.body.message, 'error');
            });
    }

    // This is to delete the row in the new opp draft datatable
    handleNewOppDeleteRow(event) {
        const getActions = event.detail.action;
        const row = event.detail.row;
        const rowId = row.tempId;

        if(getActions.name === 'delete') {
            this.newOpportunities = this.newOpportunities.filter(opp => opp.tempId !== rowId);
        }
    }

    // // Validate if there are inputs of the user for name, stage, and close date in the creation of new opportunity
    // validateOpportunity() {
    //     // for(const opp of this.newOpportunities) {
    //     if (!this.newOppName || this.newOppName.trim() === '') {
    //         this.showToast('Validation Error', 'Opportunity Name is required.', 'error');
    //         return false;
    //     }
    //     // Can be removed cause the stage is set to new by default
    //     if(!this.newOppStage  || this.newOppStage.trim() === '') {
    //         this.showToast('Validation Error', 'Stage is required.', 'error');
    //         return false;
    //     }
    //     if(!this.newOppCloseDate) {
    //         this.showToast('Validation Error', 'Close Date is required.', 'error');
    //         return false;
    //     }
    //     return true;
    // }

    // reset all fields for add new opportunity fields
    clearInputFields() {
        this.newOppName = '';
        this.newOppStage = '';
        this.newOppAmount = 0;
        this.newOppCloseDate = null;    
    }

    // ----------------------------------- EDIT OPPORTUNITY -----------------------------------

    

    // Open modal to edit multiple lines
    handleEditSelected() {
        if (this.selectedOpportunities.length === 0) {
            return this.showToast('No rows selected', 'Please select at least one row for editing', 'error');
        }
        // To not directly edit the selected rows, clone them and use the clone as the main data
        this.editOpportunities = JSON.parse(JSON.stringify(this.selectedOpportunities));
        
        this.isMassNewMode = false;
        this.isMassMode = true; 
        this.showModal = true;
    }   

    // Handles the update of the selected opportunities
    handleUpdateOpportunities() {
        const updateOppJSONStr = JSON.stringify(this.editOpportunities);
        updateOpportunityList({ opportunities: updateOppJSONStr }) 
            .then(() => {
                this.showToast('Success', 'Opportunities updated successfully', 'success');
                this.closeModal();
                this.refreshList();
            })
            .catch(error => {
                this.showToast('Error creating opportunities', error.body.message, 'error');
            });
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

    // Delete the selected rows
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
        // this.draftValues = []; //reset
        this.isMassNewMode = false;
        this.isMassMode = false;
    }

    // this will refresh/reset the array values
    refreshList() {
        return getOppsByAccountList({ accId: this.recordId })
            .then(data => {
                this.opportunities = data;
                this.selectedOpportunities = [];
                this.newOpportunities =[];
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