describe("Profile Page", () => {
    it("should load", () => {
        cy.task("profileID").then((id) => {
            expect(id, "seeded user id").to.be.a("string");
            cy.visit(`localhost:3000/profile/${id}`);
            cy.get("span").contains("root");
            cy.get("span").contains("team");
            cy.get("span").contains("point(s)");
        });
    });
});
