public with sharing class autoLeadConvert {
    public static void convertLeads(List<Lead> leadsToConvert) {
        List<Database.LeadConvert> leadConvertList = new List<Database.LeadConvert>();

        
        for(Lead ld : leadsToConvert) {
            Database.LeadConvert lc = new Database.LeadConvert();
            lc.setLeadId(ld.Id);
            lc.setConvertedStatus('Qualified');
            lc.setDoNotCreateOpportunity(false);
            leadConvertList.add(lc);
        }

        if(!leadConvertList.isEmpty()) {
            List<Database.LeadConvertResult> lcResultList = Database.convertLead(leadConvertList, false);
            for(Database.LeadConvertResult lcResult : lcResultList) {
                if(!lcResult.isSuccess()) {
                    System.debug('Lead conversion failed: ' + lcResult.getErrors()[0].getMessage());
                }
            }
        }
    }
}