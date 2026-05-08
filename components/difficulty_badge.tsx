import config from "../code-comp.json";
import { difficultyLabel, type DifficultyLevel } from "../lib/difficulty";

const STYLES: Record<DifficultyLevel, string> = {
    Easy: "bg-green-100 dark:bg-green-300 border-green-400 text-green-700",
    Medium: "bg-orange-100 dark:bg-orange-300 border-orange-400 text-orange-700",
    Hard: "bg-red-100 dark:bg-red-300 border-red-400 text-red-700",
    Insane: "bg-gray-100 dark:bg-purple-100 border-purple-400 text-purple-700",
};

function DifficultyBadge(problem: any) {
    const label = difficultyLabel(problem.difficulty, config);
    return (
        <div className={`${STYLES[label]} shadow-inner border px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}>
            {label}
        </div>
    );
}
export default DifficultyBadge;
