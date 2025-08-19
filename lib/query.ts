import { SelectByType } from "@/components/data-table";

export function parseRawQuery(option: SelectByType[], filter: string[], emptyQuery?:string) {
    return [
        option.filter(opt => filter.some(fil => opt.value === fil))
            .filter(opt => opt.operator === "OR").length > 0
            ? `(${option.filter(opt => filter.some(fil => opt.value === fil))
                .filter(opt => opt.operator === "OR")
                .map(opt => opt.value)
                .join(" or ")}) and `
            : "",
        option.filter(opt => filter.some(fil => opt.value === fil))
            .filter(opt => opt.operator === "AND").length > 0
            ? `(${option.filter(opt => filter.some(fil => opt.value === fil))
                .filter(opt => opt.operator === "AND")
                .map(opt => opt.value)
                .join(" or ")})`
            : emptyQuery  ?? "false"
    ].join("");
}