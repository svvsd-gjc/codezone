
describe("Home", () => {
    it("should load", () => {
        cy.visit("localhost:3000/dashboard");
    });
    it("should render the navbar and table", () => {
        cy.visit("localhost:3000/dashboard");
        cy.get("span").contains("CODE_ZONE");
        cy.get("span").contains("Leaderboard");
        cy.get("span").contains("Problems");
        cy.get("th").contains("Name");
        cy.get("th").contains("Description");
        cy.get("th").contains("Difficulty");
        cy.get("th").contains("Points");
    });
    it("should allow the user to navigate to the leaderboard", () => {
        cy.visit("localhost:3000/dashboard");
        cy.get("span").contains("Leaderboard").click();
        cy.url().should("include", "/leaderboard");
    });
});
