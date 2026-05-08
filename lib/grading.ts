import { exec } from "child_process";

export type CaseType = "int" | "float" | "str";

export const FLOAT_TOLERANCE = 8.38e-8;

export function compareOutputs(
    actual: string,
    expected: string[],
    type: CaseType
): boolean {
    if (type === "str") {
        return actual.trim() === expected.join("\n");
    }

    const lines = actual.trim().split("\n");
    if (lines.length !== expected.length) {return false;}

    for (let i = 0; i < lines.length; i++) {
        if (type === "int") {
            const a = parseInt(lines[i]);
            const b = parseInt(expected[i]);
            if (Number.isNaN(a) || Number.isNaN(b) || a !== b) {return false;}
        } else if (type === "float") {
            const a = parseFloat(lines[i]);
            const b = parseFloat(expected[i]);
            if (Number.isNaN(a) || Number.isNaN(b)) {return false;}
            if (Math.abs(a - b) >= FLOAT_TOLERANCE) {return false;}
        }
    }
    return true;
}

export async function checkCase(inputs: string[], outputs: string[], type: string, path: string) {
    const result: string = await new Promise((resolve, _reject) => {
        const canSetUid = typeof process.getuid === "function" && process.getuid() === 0;
        const proc = exec(`python3 -I ${path}`, {
            timeout: 500, // 1 second
            maxBuffer: 5 * 1024 * 1024, // 5MB
            uid: canSetUid ? (codecompcfg["secure-uid"] ?? undefined) : undefined,
        }, (_err, stdout, _stderr) => {
            resolve(stdout);
        });
        for (const input in inputs) {
            proc.stdin?.write(inputs[input] + "\n");
        }
    });

    return compareOutputs(result, outputs, type as CaseType);
}
