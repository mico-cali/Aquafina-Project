@isTest
public class AddPrimaryContactRoleTest {

    @isTest
    static void test_AddOCR_WhenMissing() {
        // Create a Contact
        Contact contact = new Contact(FirstName = 'John', LastName = 'Doe', Email = 'john@example.com');
        insert contact;

        // Create an Account with a Primary Contact
        Account account = new Account(Name = 'Test Account', Primary_Contact__c = contact.Id);
        insert account;

        // Create an Opportunity linked to the Account (manually)
        Opportunity opp = new Opportunity(
            Name = 'Test Opportunity',
            StageName = 'Prospecting',
            CloseDate = Date.today().addDays(30),
            AccountId = account.Id
        );
        insert opp;

        // Verify the Opportunity Contact Role was created
        List<OpportunityContactRole> ocrList = [
            SELECT Id, OpportunityId, ContactId, Role, IsPrimary 
            FROM OpportunityContactRole 
            WHERE OpportunityId = :opp.Id
        ];

        System.assertEquals(1, ocrList.size(), 'One OCR should be created');
        System.assertEquals(contact.Id, ocrList[0].ContactId, 'OCR should be linked to the Primary Contact');
        System.assertEquals(true, ocrList[0].IsPrimary, 'OCR should be marked as primary');
    }

    @isTest
    static void test_NoDuplicateOCR_WhenAlreadyExists() {
        // Create a Contact
        Contact contact = new Contact(FirstName = 'Jane', LastName = 'Smith', Email = 'jane@example.com');
        insert contact;

        // Create an Account with a Primary Contact
        Account account = new Account(Name = 'Duplicate OCR Account', Primary_Contact__c = contact.Id);
        insert account;

        // Create an Opportunity
        Opportunity opp = new Opportunity(
            Name = 'Existing OCR Opportunity',
            StageName = 'Qualification',
            CloseDate = Date.today().addDays(15),
            AccountId = account.Id
        );
        insert opp;

        // Simulate an existing OCR (like from Lead Conversion)
        OpportunityContactRole existingOCR = new OpportunityContactRole(
            OpportunityId = opp.Id,
            ContactId = contact.Id,
            Role = 'Influencer',
            IsPrimary = true
        );
        insert existingOCR;

        // Insert another Opportunity for the same Account
        Opportunity opp2 = new Opportunity(
            Name = 'Second Opportunity',
            StageName = 'Qualification',
            CloseDate = Date.today().addDays(20),
            AccountId = account.Id
        );
        insert opp2;

        // Should only create an OCR for opp2, not for opp (which already had one)
        List<OpportunityContactRole> ocrsOpp1 = [
            SELECT Id FROM OpportunityContactRole WHERE OpportunityId = :opp.Id
        ];
        List<OpportunityContactRole> ocrsOpp2 = [
            SELECT Id FROM OpportunityContactRole WHERE OpportunityId = :opp2.Id
        ];

        System.assertEquals(1, ocrsOpp1.size(), 'First Opportunity should still have 1 OCR (pre-existing)');
        System.assertEquals(1, ocrsOpp2.size(), 'Second Opportunity should get 1 new OCR');
    }
}
