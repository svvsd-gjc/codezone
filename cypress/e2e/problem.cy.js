describe("Problem Page", () => {
    it("should load", () => {
        cy.visit("localhost:3000/problem/1?ctx=none");
        cy.get("span").contains("CODE_ZONE");
        cy.get("span").contains("points");
        cy.get("span").contains("difficulty");
    });
});