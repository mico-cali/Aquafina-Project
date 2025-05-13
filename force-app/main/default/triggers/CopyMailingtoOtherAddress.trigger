// Trigger to copy maling address to other address
trigger CopyMailingtoOtherAddress on Contact (before insert) {
    for (Contact cont : Trigger.new) {
        if(cont.OtherCity == null) {
            cont.OtherStreet = cont.MailingStreet;
            cont.OtherCity = cont.MailingCity;
            cont.OtherState = cont.MailingState;
            cont.OtherPostalCode = cont.MailingPostalCode;
            cont.OtherCountry = cont.MailingCountry;
        }
    }
}