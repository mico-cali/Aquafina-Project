// This trigger will copy the default address added from billing to shipping address
trigger CopyBillingToShipping on Account (before insert) {
    for (Account acc : Trigger.new) {
        if(acc.ShippingCity == null) {
            acc.ShippingStreet = acc.BillingStreet;
            acc.ShippingCity = acc.BillingCity;
            acc.ShippingState = acc.BillingState;
            acc.ShippingPostalCode = acc.BillingPostalCode;
            acc.ShippingCountry = acc.BillingCountry;
        }
    }
}