public with sharing class QuoteTriggerHandler {
    public static void processSelectedQuotes(List<Quote> selectedQuotes) {
        Set<Id> opportunityIds = new Set<Id>();
        Set<Id> selectedQuoteIds = new Set<Id>();
        
        for(Quote qte : selectedQuotes) {
            if(qte.OpportunityId != null) {
                opportunityIds.add(qte.OpportunityId);
                selectedQuoteIds.add(qte.Id);
            }
        }

        // 1. Uncheck other quotes
        List<Quote> quotesToUncheck = [
            SELECT Id, Customer_Selected__c
            FROM Quote
            WHERE OpportunityId IN :opportunityIds
            AND Customer_Selected__c = TRUE
            AND Id NOT IN :selectedQuoteIds
        ];

        for (Quote qte : quotesToUncheck) {
            qte.Customer_Selected__c = false;
        }
        update quotesToUncheck;

        // 2. Delete existing OpportunityLineItems
        List<OpportunityLineItem> OppLineItemDelete = [
            SELECT Id
            FROM OpportunityLineItem
            WHERE OpportunityId IN :opportunityIds
        ];
        delete OppLineItemDelete;

        // 3. Copy QuoteLineItems to OpportunityLineItems
        List<QuoteLineItem> quoteLineList = [
            SELECT Id, PricebookEntryId, Quantity, UnitPrice, Quote.OpportunityId
            FROM QuoteLineItem
            WHERE QuoteId IN :selectedQuoteIds
        ];

        List<OpportunityLineItem> newOppLineList = new List<OpportunityLineItem>();
        for(QuoteLineItem qli : quoteLineList) {
            OpportunityLineItem oppLine = new OpportunityLineItem();    
            oppLine.OpportunityId = qli.Quote.OpportunityId;
            oppLine.Quantity = qli.Quantity;
            oppLine.UnitPrice = qli.UnitPrice;
            oppLine.PricebookEntryId = qli.PricebookEntryId;
            newOppLineList.add(oppLine); 
        }

        insert newOppLineList;
    }
}
