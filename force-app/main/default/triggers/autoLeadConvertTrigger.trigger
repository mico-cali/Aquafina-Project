trigger autoLeadConvertTrigger on Lead (after insert) {
    List<Lead> leadsToConvert = new List<Lead>();

    for(Lead ld : Trigger.new) {
        if(ld.LeadSource == 'Web' && ld.Rating == 'Hot' && !ld.IsConverted) {
            leadsToConvert.add(ld);
        }
    }

    if(!leadsToConvert.isEmpty()) {
        autoLeadConvert.convertLeads(leadsToConvert);
    }
}