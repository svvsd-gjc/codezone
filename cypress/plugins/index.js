/// <reference types="cypress" />

const { PrismaClient } = require("@prisma/client");

module.exports = (on, config) => {
    const prisma = new PrismaClient();
    on("task", {
        async problemID() {
            const p = await prisma.problem.findFirst({
                orderBy: { name: "asc" },
                select: { id: true },
            });
            return p?.id ?? null;
        },
        async profileID() {
            const u = await prisma.user.findFirst({
                orderBy: { name: "asc" },
                select: { id: true },
            });
            return u?.id ?? null;
        },
    });
};
