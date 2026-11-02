import { DescPattern, FileInfoSchema } from './types'; // Temel tip dosyanızdan import edin

function isWildcardPattern(val: string): boolean {
    return val.includes('*');
}

function wildcardToRegex(wildcard: string): RegExp | null {
    const trimmed = wildcard.trim();
    if (!trimmed) return null;

    let pattern = trimmed.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    pattern = pattern.replace(/\*/g, '.*');

    return new RegExp(`^${pattern}$`, 'i');
}

/**
 * Listeyi hafif ve optimize bir şekilde 'expr' alanına göre sıralayıp 
 * FileInfoSchema yapısına uygun alt dizilere dağıtır.
 */
export const generateFileInfoSchema = (
    rawPatterns: DescPattern[],
    maxFileSizeMB = 50,
    flagEmptyDirectories = true
): FileInfoSchema => {
    // 1. 'expr' alanına göre alfabetik sıralama (case-insensitive)
    const sortedPatterns = [...rawPatterns].sort((a, b) =>
        a.expr.localeCompare(b.expr, undefined, { sensitivity: 'base' })
    );

    const extensionDescriptions: any[] = [];
    const customIgnoreList: any[] = [];
    const regExpIgnoreList: any[] = [];

    // 2. Doğrusal dağıtım döngüsü
    sortedPatterns.forEach((pattern) => {
        if (pattern.isExt) {
            extensionDescriptions.push(pattern);
        } else if (isWildcardPattern(pattern.expr)) {
            const regexObj = wildcardToRegex(pattern.expr);
            if (regexObj) {
                regExpIgnoreList.push({ ...pattern, expr: regexObj });
            } else {
                customIgnoreList.push(pattern);
            }
        } else {
            customIgnoreList.push(pattern);
        }
    });

    return {
        maxFileSizeMB,
        flagEmptyDirectories,
        customIgnoreList,
        regExpIgnoreList,
        extensionDescriptions,
    };
};
