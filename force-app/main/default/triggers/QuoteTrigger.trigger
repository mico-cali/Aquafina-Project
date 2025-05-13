trigger QuoteTrigger on Quote (after update) {
    List<Quote> selectedQuotes = new List<Quote>();

    for (Quote qte : Trigger.new) {
        Quote oldQ = Trigger.oldMap.get(qte.Id);
        if(
            qte.Customer_Selected__c == true &&
            qte.Status == 'Accepted' &&
            (oldQ.Customer_Selected__c != qte.Customer_Selected__c || oldQ.Status != qte.Status)
        ) {
            selectedQuotes.add(qte);
        }
    }

    if(!selectedQuotes.isEmpty()) {
        QuoteTriggerHandler.processSelectedQuotes(selectedQuotes);
    }
}
