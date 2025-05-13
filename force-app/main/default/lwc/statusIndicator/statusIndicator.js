import { LightningElement, api, wire } from 'lwc';
// this will fetch salesforce lead record data
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = ['Lead.Status'];

export default class StatusIndicator extends LightningElement {
    @api recordId;

    statusLabel;
    badgeStyle;

    // fetch the Lead data through wire
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredLead({ data }) {
        if(data) {
            const status = data.fields.Status.value;

            // call helper function to determine the status 
            this.setBadge(status);
        }
    }

    // Helper function to set the badge style and label based on the lead status
    setBadge(status) {
        switch(status) {
            case 'To contact':
                this.statusLabel = 'TO CONTACT';
                this.badgeStyle = 'background-color: red; color: white; padding: 6px 10px; font-weight: bold; border-radius: 4px;';
                break;
            case 'In progress':
                this.statusLabel = 'IN PROGRESS';
                this.badgeStyle = 'background-color: blue; color: white; padding: 6px 10px; font-weight: bold; border-radius: 4px;';
                break;
            case 'Qualified':
                this.statusLabel = 'QUALIFIED';
                this.badgeStyle = 'background-color: green; color: white; padding: 6px 10px; font-weight: bold; border-radius: 4px;';
                break;
            case 'Disqualified':
                this.statusLabel = 'DISQUALIFIED';
                this.badgeStyle = 'background-color: black; color: white; padding: 6px 10px; font-weight: bold; border-radius: 4px;';
                break;
            default:
                this.statusLabel = 'NOT ASSIGNED';
                this.badgeStyle = 'background-color: grey; color: white; padding: 6px 10px; font-weight: bold; border-radius: 4px;';
        }
    }
}