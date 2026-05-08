describe("Problem Page", () => {
    it("should load", () => {
        cy.task("problemID").then((id) => {
            expect(id, "seeded problem id").to.be.a("string");
            cy.visit(`localhost:3000/problem/${id}?ctx=none`);
            cy.get("span").contains("CODE_ZONE");
            cy.get("span").contains("Points:");
            cy.get("span").contains(/Easy|Medium|Hard|Insane/);
        });
    });
    it("should have cases", () => {
        cy.task("problemID").then((id) => {
            cy.visit(`localhost:3000/problem/${id}?ctx=none`);
            cy.get("span").contains("Example Case");
            cy.get("span").contains("Inputs");
            cy.get("span").contains("Outputs");
        });
    });
    it("should have submit form", () => {
        cy.task("problemID").then((id) => {
            cy.visit(`localhost:3000/problem/${id}?ctx=none`);
            cy.get('input[type="file"][name="uploaded_file"]').should("be.visible");
            cy.get('button[type="submit"]').should("exist");
        });
    });
});
