
describe("Home", () => {
    it("should load", () => {
        cy.visit("localhost:3000/dashboard");
    });
    it("should render the navbar and table", () => {
        cy.visit("localhost:3000/dashboard");
        cy.get("span").contains("CODE_ZONE");
        cy.get("span").contains("leaderboard");
        cy.get("span").contains("problems");
        cy.get("th").contains("Name");
        cy.get("th").contains("Description");
        cy.get("th").contains("Difficulty");
        cy.get("th").contains("Points");
    });
    it("should allow the user to naviagate to the leaderboard", () => {
        cy.visit("localhost:3000/dashboard");
        cy.get("span").contains("leaderboard").click();
        cy.url().should("include", "/leaderboard");
    });
});
