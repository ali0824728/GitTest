/** * ============================================================ * STARLIGHT ENGINE * Python Language Extension * ============================================================ * * Production-oriented Python language service. * * Features: *  - Stateful Python lexer *  - Multiline strings *  - Comments *  - Decorators *  - Numbers *  - Operators *  - Python keywords *  - Builtins *  - Functions *  - Classes *  - Variables *  - Parameters *  - Properties *  - Methods *  - Imports *  - Scope detection *  - Symbol outline *  - Folding ranges *  - Diagnostics *  - Document symbols *  - Basic definition navigation *  - Basic reference discovery *  - Semantic token classification *  - Incremental-document-ready API * * No external dependency required. * * IMPORTANT: * This is a production-oriented lexical/structural engine, * not a complete Python compiler/parser. * * For maximum Python compatibility, the parser layer can later * be replaced with Tree-sitter Python without changing the * extension API. * ============================================================ */"use strict";
/* ============================================================ * 1. VERSION * ============================================================ */const STARLIGHT_PYTHON_EXTENSION_VERSION = "2.0.0";
/* ============================================================ * 2. PYTHON TOKEN TYPES * ============================================================ */const PythonTokenType = Object.freeze({
        KEYWORD: "keyword",    IDENTIFIER: "identifier",    FUNCTION_NAME: "functionName",    CLASS_NAME: "className",    BUILTIN_FUNCTION: "builtInFunction",    BUILTIN_TYPE: "builtInType",    BUILTIN_CONSTANT: "builtInConstant",    VARIABLE: "variable",    PARAMETER: "parameter",    PROPERTY: "property",    METHOD: "method",    OPERATOR: "operator",    PUNCTUATION: "punctuation",    NUMBER: "number",    STRING: "string",    F_STRING: "fString",    F_STRING_EXPRESSION: "fStringExpression",    COMMENT: "comment",    DOC_COMMENT: "docComment",    DECORATOR: "decorator",    WHITESPACE: "whitespace",    NEWLINE: "newline",    UNKNOWN: "unknown"
});
/* ============================================================ * 3. SYMBOL TYPES * ============================================================ */const SymbolKind = Object.freeze({
        MODULE: "module",    CLASS: "class",    FUNCTION: "function",    METHOD: "method",    VARIABLE: "variable",    CONSTANT: "constant",    PARAMETER: "parameter",    IMPORT: "import",    PROPERTY: "property",    LAMBDA: "lambda"
});
/* ============================================================ * 4. DIAGNOSTIC TYPES * ============================================================ */const DiagnosticSeverity = Object.freeze({
        ERROR: "error",    WARNING: "warning",    INFO: "info",    HINT: "hint"
});
/* ============================================================ * 5. PYTHON KEYWORDS * ============================================================ */const KEYWORDS = new Set([    "False",    "None",    "True",    "and",    "as",    "assert",    "async",    "await",    "break",    "case",    "class",    "continue",    "def",    "del",    "elif",    "else",    "except",    "finally",    "for",    "from",    "global",    "if",    "import",    "in",    "is",    "lambda",    "match",    "nonlocal",    "not",    "or",    "pass",    "raise",    "return",    "try",    "while",    "with",    "yield"]);
/* ============================================================ * 6. BUILTIN FUNCTIONS * ============================================================ */const BUILTIN_FUNCTIONS = new Set([    "abs",    "aiter",    "all",    "anext",    "any",    "ascii",    "bin",    "bool",    "breakpoint",    "bytearray",    "bytes",    "callable",    "chr",    "classmethod",    "compile",    "complex",    "delattr",    "dict",    "dir",    "divmod",    "enumerate",    "eval",    "exec",    "filter",    "float",    "format",    "frozenset",    "getattr",    "globals",    "hasattr",    "hash",    "help",    "hex",    "id",    "input",    "int",    "isinstance",    "issubclass",    "iter",    "len",    "list",    "locals",    "map",    "max",    "memoryview",    "min",    "next",    "object",    "oct",    "open",    "ord",    "pow",    "print",    "property",    "range",    "repr",    "reversed",    "round",    "set",    "setattr",    "slice",    "sorted",    "staticmethod",    "str",    "sum",    "super",    "tuple",    "type",    "vars",    "zip"]);
/* ============================================================ * 7. BUILTIN TYPES * ============================================================ */const BUILTIN_TYPES = new Set([    "bool",    "bytearray",    "bytes",    "complex",    "dict",    "float",    "frozenset",    "int",    "list",    "memoryview",    "object",    "set",    "str",    "tuple",    "type"]);
/* ============================================================ * 8. BUILTIN CONSTANTS * ============================================================ */const BUILTIN_CONSTANTS = new Set([    "True",    "False",    "None",    "NotImplemented",    "Ellipsis"]);
/* ============================================================ * 9. OPERATORS * ============================================================ */const OPERATORS = [    ">>=",    "<<=",    "**=",    "//=",    "==",    "!=",    "<=",    ">=",    ":=",    "+=",    "-=",    "*=",    "/=",    "%=",    "&=",    "|=",    "^=",    "->",    "//",    "**",    "<<",    ">>",    "+",    "-",    "*",    "/",    "%",    "@",    "&",    "|",    "^",    "~",    "<",    ">",    "="].sort((a, b) => b.length - a.length);
/* ============================================================ * 10. PUNCTUATION * ============================================================ */const PUNCTUATION = new Set([    "(",    ")",    "[",    "]",    "{",    "}",    ":",    ",",    ".",    ";"]);
/* ============================================================ * 11. UTILITY CLASSES * ============================================================ */class Position {
        constructor(line, column, offset) {
                this.line = line;
                this.column = column;
                this.offset = offset;

    }

}
class Range {
        constructor(start, end) {
                this.start = start;
                this.end = end;

    }

}
class PythonToken {
        constructor({
                type,        text,        start,        end,        line,        column,        metadata = {
            }

    }) {
                this.type = type;
                this.text = text;
                this.startOffset = start;
                this.endOffset = end;
                this.line = line;
                this.column = column;
                this.metadata = metadata;

    }

}
class SymbolNode {
        constructor({
                name,        kind,        line,        column,        startOffset = 0,        endOffset = 0,        children = [],        parent = null,        metadata = {
            }

    }) {
                this.name = name;
                this.kind = kind;
                this.line = line;
                this.column = column;
                this.startOffset = startOffset;
                this.endOffset = endOffset;
                this.children = children;
                this.parent = parent;
                this.metadata = metadata;

    }

}
class Diagnostic {
        constructor({
                message,        severity = DiagnosticSeverity.WARNING,        line,        column,        endLine = line,        endColumn = column,        code = null
    }) {
                this.message = message;
                this.severity = severity;
                this.line = line;
                this.column = column;
                this.endLine = endLine;
                this.endColumn = endColumn;
                this.code = code;

    }

}
/* ============================================================ * 12. LINE INDEX * ============================================================ */class LineIndex {
        constructor(source) {
                this.source = source;
                this.lines = [];
                this.build();

    }
        build() {
                this.lines = [];
                let start = 0;
                for (let i = 0; i < this.source.length; i++) {
                        if (this.source[i] === "\n") {
                                this.lines.push({
                                        start,                    end: i,                    text: this.source.slice(start, i)
                });
                                start = i + 1;

            }

        }
                this.lines.push({
                        start,            end: this.source.length,            text: this.source.slice(start)
        });

    }
        getLine(line) {
                return this.lines[line] || null;

    }
        getLineCount() {
                return this.lines.length;

    }
        offsetToPosition(offset) {
                offset = Math.max(            0,            Math.min(offset, this.source.length)        );
                let low = 0;
                let high = this.lines.length - 1;
                while (low <= high) {
                        const mid = (low + high) >> 1;
                        const line = this.lines[mid];
                        if (offset < line.start) {
                                high = mid - 1;

            }
             else if (offset > line.end) {
                                low = mid + 1;

            }
             else {
                                return new Position(                    mid,                    offset - line.start,                    offset                );

            }

        }
                const last = this.lines.length - 1;
                return new Position(            last,            this.lines[last].text.length,            offset        );

    }

}
/* ============================================================ * 13. PYTHON LEXER * ============================================================ */class PythonLexer {
        constructor(source) {
                this.source = source;
                this.length = source.length;
                this.tokens = [];
                this.line = 0;
                this.column = 0;
                this.offset = 0;
                this.indentStack = [0];
                this.parenDepth = 0;
                this.bracketDepth = 0;
                this.braceDepth = 0;
                this.previousSignificantToken = null;

    }
        current() {
                return this.source[this.offset];

    }
        peek(distance = 1) {
                return this.source[this.offset + distance];

    }
        advance(count = 1) {
                for (let i = 0; i < count; i++) {
                        const char = this.source[this.offset];
                        if (char === "\n") {
                                this.line++;
                                this.column = 0;

            }
             else {
                                this.column++;

            }
                        this.offset++;

        }

    }
        addToken(type, start, end, metadata = {
        }) {
                const text = this.source.slice(start, end);
                const lineIndex = this.getLineAtOffset(start);
                const lineStart =            lineIndex === 0                ? 0                : this.source.lastIndexOf("\n", start - 1) + 1;
                const token = new PythonToken({
                        type,            text,            start,            end,            line: lineIndex,            column: start - lineStart,            metadata
        });
                this.tokens.push(token);
                if (            type !== PythonTokenType.WHITESPACE &&            type !== PythonTokenType.NEWLINE        ) {
                        this.previousSignificantToken = token;

        }
                return token;

    }
        getLineAtOffset(offset) {
                let low = 0;
                let high = offset;
                let line = 0;
                while (low <= high) {
                        const mid = (low + high) >> 1;
                        let count = 0;
                        for (                let i = 0;                i <= mid && i < this.source.length;                i++            ) {
                                if (this.source[i] === "\n") {
                                        count++;

                }

            }
                        if (count <= line) {
                                low = mid + 1;

            }
             else {
                                high = mid - 1;

            }
                        line = count;

        }
                return line;

    }
        isIdentifierStart(char) {
                return !!char && /[A-Za-z_]/.test(char);

    }
        isIdentifierPart(char) {
                return !!char && /[A-Za-z0-9_]/.test(char);

    }
        readIdentifier() {
                const start = this.offset;
                this.advance();
                while (this.isIdentifierPart(this.current())) {
                        this.advance();

        }
                return this.source.slice(start, this.offset);

    }
        readNumber() {
                const start = this.offset;
                /*         * Python numeric literals:         *         * 10         * 10.5         * .5         * 10e5         * 0xFF         * 0b1010         * 0o755         * 1_000_000         */        if (            this.current() === "0" &&            ["x", "X", "b", "B", "o", "O"].includes(this.peek())        ) {
                        this.advance(2);
                        while (                this.current() &&                /[A-Za-z0-9_]/.test(this.current())            ) {
                                this.advance();

            }
                        return this.source.slice(start, this.offset);

        }
                while (            this.current() &&            /[0-9A-Fa-f_.eE+-]/.test(this.current())        ) {
                        const current = this.current();
                        if (                (current === "+" || current === "-") &&                !["e", "E"].includes(this.peek(-1))            ) {
                                break;

            }
                        this.advance();

        }
                return this.source.slice(start, this.offset);

    }
        readString() {
                const start = this.offset;
                let prefix = "";
                while (            this.current() &&            /[rRuUbBfF]/.test(this.current())        ) {
                        prefix += this.current();
                        this.advance();
                        if (prefix.length >= 3) {
                                break;

            }

        }
                const quote = this.current();
                if (quote !== "'" && quote !== '"') {
                        return false;

        }
                const quoteChar = quote;
                const triple =            this.peek(1) === quoteChar &&            this.peek(2) === quoteChar;
                if (triple) {
                        this.advance(3);
                        while (this.offset < this.length) {
                                if (                    this.current() === quoteChar &&                    this.peek(1) === quoteChar &&                    this.peek(2) === quoteChar                ) {
                                        this.advance(3);
                                        break;

                }
                                this.advance();

            }

        }
         else {
                        this.advance();
                        while (this.offset < this.length) {
                                const char = this.current();
                                if (char === "\\") {
                                        this.advance(2);
                                        continue;

                }
                                if (char === quoteChar) {
                                        this.advance();
                                        break;

                }
                                if (char === "\n") {
                                        break;

                }
                                this.advance();

            }

        }
                const text = this.source.slice(start, this.offset);
                return {
                        text,            start,            end: this.offset,            isFString: prefix.toLowerCase().includes("f"),            isTriple: triple
        };

    }
        readDecorator() {
                const start = this.offset;
                this.advance();
                while (this.current()) {
                        const char = this.current();
                        if (                /[A-Za-z0-9_.]/.test(char) ||                char === "(" ||                char === ")" ||                char === "," ||                char === "=" ||                char === "'" ||                char === '"' ||                char === " "            ) {
                                this.advance();
                                continue;

            }
                        break;

        }
                return this.source.slice(start, this.offset);

    }
        readComment() {
                const start = this.offset;
                while (            this.current() &&            this.current() !== "\n"        ) {
                        this.advance();

        }
                return this.source.slice(start, this.offset);

    }
        consumeIndentation() {
                const start = this.offset;
                let spaces = 0;
                let tabs = 0;
                while (this.current() === " " || this.current() === "\t") {
                        if (this.current() === "\t") {
                                tabs++;
                                spaces += 4;

            }
             else {
                                spaces++;

            }
                        this.advance();

        }
                const lineText = this.source.slice(            start,            this.offset        );
                const currentIndent = spaces;
                const previousIndent =            this.indentStack[this.indentStack.length - 1];
                if (currentIndent > previousIndent) {
                        this.indentStack.push(currentIndent);

        }
         else if (currentIndent < previousIndent) {
                        while (                this.indentStack.length > 1 &&                currentIndent <                    this.indentStack[                        this.indentStack.length - 1                    ]            ) {
                                this.indentStack.pop();

            }

        }
                return {
                        spaces,            tabs,            text: lineText
        };

    }
        updateDelimiterDepth(char) {
                if (char === "(") this.parenDepth++;
                if (char === ")") this.parenDepth--;
                if (char === "[") this.bracketDepth++;
                if (char === "]") this.bracketDepth--;
                if (char === "{") this.braceDepth++;
                if (char === "}") this.braceDepth--;
                this.parenDepth = Math.max(0, this.parenDepth);
                this.bracketDepth = Math.max(0, this.bracketDepth);
                this.braceDepth = Math.max(0, this.braceDepth);

    }
        classifyIdentifier(identifier) {
                if (KEYWORDS.has(identifier)) {
                        return PythonTokenType.KEYWORD;

        }
                if (BUILTIN_CONSTANTS.has(identifier)) {
                        return PythonTokenType.BUILTIN_CONSTANT;

        }
                if (BUILTIN_TYPES.has(identifier)) {
                        return PythonTokenType.BUILTIN_TYPE;

        }
                if (BUILTIN_FUNCTIONS.has(identifier)) {
                        return PythonTokenType.BUILTIN_FUNCTION;

        }
                const previous = this.previousSignificantToken;
                if (previous) {
                        if (                previous.text === "def" ||                previous.text === "async"            ) {
                                return PythonTokenType.FUNCTION_NAME;

            }
                        if (previous.text === "class") {
                                return PythonTokenType.CLASS_NAME;

            }
                        if (previous.text === ".") {
                                return PythonTokenType.PROPERTY;

            }

        }
                return PythonTokenType.IDENTIFIER;

    }
        lex() {
                while (this.offset < this.length) {
                        const char = this.current();
                        /* --------------------------------------------             * Whitespace             * --------------------------------------------             */            if (char === " " || char === "\t") {
                                const start = this.offset;
                                while (                    this.current() === " " ||                    this.current() === "\t"                ) {
                                        this.advance();

                }
                                this.addToken(                    PythonTokenType.WHITESPACE,                    start,                    this.offset                );
                                continue;

            }
                        /* --------------------------------------------             * Newline             * --------------------------------------------             */            if (char === "\n") {
                                const start = this.offset;
                                this.advance();
                                /*                 * Newline inside (), [] or {} is not a                 * logical Python statement boundary.                 */                this.addToken(                    PythonTokenType.NEWLINE,                    start,                    this.offset,                    {
                                            logical:                            this.parenDepth === 0 &&                            this.bracketDepth === 0 &&                            this.braceDepth === 0
                });
                                continue;

            }
                        /* --------------------------------------------             * Comments             * --------------------------------------------             */            if (char === "#") {
                                const start = this.offset;
                                this.readComment();
                                this.addToken(                    PythonTokenType.COMMENT,                    start,                    this.offset                );
                                continue;

            }
                        /* --------------------------------------------             * Decorators             * --------------------------------------------             */            if (                char === "@" &&                (                    !this.previousSignificantToken ||                    this.previousSignificantToken.type ===                        PythonTokenType.NEWLINE                )            ) {
                                const start = this.offset;
                                this.readDecorator();
                                this.addToken(                    PythonTokenType.DECORATOR,                    start,                    this.offset                );
                                continue;

            }
                        /* --------------------------------------------             * Strings             * --------------------------------------------             */            if (                char === "'" ||                char === '"' ||                (                    /[rRuUbBfF]/.test(char) &&                    (                        this.peek() === "'" ||                        this.peek() === '"'                    )                )            ) {
                                const result = this.readString();
                                if (result) {
                                        this.addToken(                        result.isFString                            ? PythonTokenType.F_STRING                            : PythonTokenType.STRING,                        result.start,                        result.end,                        {
                                                    triple: result.isTriple,                            fString: result.isFString
                    });
                                        continue;

                }

            }
                        /* --------------------------------------------             * Numbers             * --------------------------------------------             */            if (                /[0-9]/.test(char) ||                (                    char === "." &&                    /[0-9]/.test(this.peek())                )            ) {
                                const start = this.offset;
                                this.readNumber();
                                this.addToken(                    PythonTokenType.NUMBER,                    start,                    this.offset                );
                                continue;

            }
                        /* --------------------------------------------             * Identifiers             * --------------------------------------------             */            if (this.isIdentifierStart(char)) {
                                const start = this.offset;
                                const identifier =                    this.readIdentifier();
                                const type =                    this.classifyIdentifier(                        identifier                    );
                                this.addToken(                    type,                    start,                    this.offset                );
                                continue;

            }
                        /* --------------------------------------------             * Operators             * --------------------------------------------             */            let operatorFound = false;
                        for (const operator of OPERATORS) {
                                if (                    this.source.startsWith(                        operator,                        this.offset                    )                ) {
                                        const start = this.offset;
                                        this.advance(operator.length);
                                        this.addToken(                        PythonTokenType.OPERATOR,                        start,                        this.offset                    );
                                        operatorFound = true;
                                        break;

                }

            }
                        if (operatorFound) {
                                continue;

            }
                        /* --------------------------------------------             * Punctuation             * --------------------------------------------             */            if (PUNCTUATION.has(char)) {
                                const start = this.offset;
                                this.updateDelimiterDepth(char);
                                this.advance();
                                this.addToken(                    PythonTokenType.PUNCTUATION,                    start,                    this.offset                );
                                continue;

            }
                        /* --------------------------------------------             * Unknown             * --------------------------------------------             */            const start = this.offset;
                        this.advance();
                        this.addToken(                PythonTokenType.UNKNOWN,                start,                this.offset            );

        }
                return this.tokens;

    }

}
/* ============================================================ * 14. PYTHON SYMBOL ANALYZER * ============================================================ */class PythonSymbolAnalyzer {
        constructor(source, tokens) {
                this.source = source;
                this.tokens = tokens;
                this.symbols = [];
                this.scopeStack = [];
                this.lines = source.split("\n");

    }
        getIndentation(line) {
                let indentation = 0;
                for (const char of line) {
                        if (char === " ") {
                                indentation++;

            }
             else if (char === "\t") {
                                indentation += 4;

            }
             else {
                                break;

            }

        }
                return indentation;

    }
        findTokenOnLine(line, text) {
                return this.tokens.find(            token =>                token.line === line &&                token.text === text        );

    }
        getPreviousMeaningfulLine(line) {
                for (let i = line - 1; i >= 0; i--) {
                        const text =                this.lines[i].trim();
                        if (                text.length > 0 &&                !text.startsWith("#")            ) {
                                return i;

            }

        }
                return -1;

    }
        createSymbol({
                name,        kind,        line,        column,        metadata = {
            }

    }) {
                return new SymbolNode({
                        name,            kind,            line,            column,            metadata
        });

    }
        build() {
                const roots = [];
                const lines = this.lines;
                for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith("#")) {
                                continue;

            }
                        const indentation =                this.getIndentation(line);
                        /* --------------------------------------------             * Class             * --------------------------------------------             */            const classMatch =                trimmed.match(                    /^class\s+([A-Za-z_][A-Za-z0-9_]*)/                );
                        if (classMatch) {
                                const name = classMatch[1];
                                const column =                    line.indexOf(name);
                                const symbol =                    this.createSymbol({
                                            name,                        kind: SymbolKind.CLASS,                        line: i,                        column,                        metadata: {
                                                    indentation,                            bases: this.extractClassBases(trimmed)
                    }

                });
                                symbol._indentation = indentation;
                                this.attachSymbol(                    symbol,                    roots                );
                                continue;

            }
                        /* --------------------------------------------             * Function / Async Function             * --------------------------------------------             */            const functionMatch =                trimmed.match(                    /^(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)/                );
                        if (functionMatch) {
                                const name =                    functionMatch[1];
                                const column =                    line.indexOf(name);
                                const isAsync =                    /^async\s+def/.test(trimmed);
                                const parameters =                    this.extractParameters(trimmed);
                                const kind =                    this.isInsideClass(indentation)                        ? SymbolKind.METHOD                        : SymbolKind.FUNCTION;
                                const symbol =                    this.createSymbol({
                                            name,                        kind,                        line: i,                        column,                        metadata: {
                                                    indentation,                            async: isAsync,                            parameters
                    }

                });
                                symbol._indentation = indentation;
                                this.attachSymbol(                    symbol,                    roots                );
                                continue;

            }
                        /* --------------------------------------------             * Imports             * --------------------------------------------             */            const importMatch =                trimmed.match(                    /^import\s+(.+)$/                );
                        if (importMatch) {
                                const imports =                    this.parseImportStatement(                        importMatch[1]                    );
                                for (const item of imports) {
                                        const symbol =                        this.createSymbol({
                                                    name: item.name,                            kind: SymbolKind.IMPORT,                            line: i,                            column:                                line.indexOf(item.name),                            metadata: item
                    });
                                        symbol._indentation =                        indentation;
                                        this.attachSymbol(                        symbol,                        roots                    );

                }
                                continue;

            }
                        const fromMatch =                trimmed.match(                    /^from\s+([A-Za-z0-9_.]+)\s+import\s+(.+)$/                );
                        if (fromMatch) {
                                const module =                    fromMatch[1];
                                const imported =                    fromMatch[2];
                                for (                    const item of imported.split(",")                ) {
                                        const clean =                        item                            .trim()                            .split(/\s+as\s+/);
                                        const name =                        clean[clean.length - 1];
                                        const symbol =                        this.createSymbol({
                                                    name,                            kind: SymbolKind.IMPORT,                            line: i,                            column:                                line.indexOf(name),                            metadata: {
                                                            module,                                original:                                    clean[0],                                alias:                                    clean.length > 1                                        ? clean[1]                                        : null
                        }

                    });
                                        symbol._indentation =                        indentation;
                                        this.attachSymbol(                        symbol,                        roots                    );

                }
                                continue;

            }
                        /* --------------------------------------------             * Top-level / local variable             * --------------------------------------------             */            const assignmentMatch =                trimmed.match(                    /^([A-Za-z_][A-Za-z0-9_]*)\s*(?::[^=]+)?=/                );
                        if (assignmentMatch) {
                                const name =                    assignmentMatch[1];
                                const isConstant =                    /^[A-Z][A-Z0-9_]*$/.test(name);
                                const symbol =                    this.createSymbol({
                                            name,                        kind:                            isConstant                                ? SymbolKind.CONSTANT                                : SymbolKind.VARIABLE,                        line: i,                        column:                            line.indexOf(name),                        metadata: {
                                                    indentation,                            declaration: true
                    }

                });
                                symbol._indentation =                    indentation;
                                /*                 * Only expose top-level variables in                 * the primary outline.                 */                if (indentation === 0) {
                                        roots.push(symbol);

                }

            }

        }
                this.cleanupInternalProperties(roots);
                return roots;

    }
        attachSymbol(symbol, roots) {
                while (this.scopeStack.length > 0) {
                        const parent =                this.scopeStack[                    this.scopeStack.length - 1                ];
                        if (                symbol._indentation >                parent._indentation            ) {
                                break;

            }
                        this.scopeStack.pop();

        }
                if (this.scopeStack.length === 0) {
                        roots.push(symbol);

        }
         else {
                        const parent =                this.scopeStack[                    this.scopeStack.length - 1                ];
                        symbol.parent = parent;
                        parent.children.push(symbol);

        }
                this.scopeStack.push(symbol);

    }
        isInsideClass(indentation) {
                for (            let i = this.scopeStack.length - 1;            i >= 0;            i--        ) {
                        const scope =                this.scopeStack[i];
                        if (                scope.kind === SymbolKind.CLASS &&                indentation >                    scope._indentation            ) {
                                return true;

            }

        }
                return false;

    }
        extractClassBases(line) {
                const match =            line.match(                /^class\s+[A-Za-z_][A-Za-z0-9_]*\s*(?:\((.*?)\))?/            );
                if (!match || !match[1]) {
                        return [];

        }
                return match[1]            .split(",")            .map(x => x.trim())            .filter(Boolean);

    }
        extractParameters(line) {
                const start =            line.indexOf("(");
                if (start === -1) {
                        return [];

        }
                let depth = 0;
                let end = -1;
                for (            let i = start;            i < line.length;            i++        ) {
                        if (line[i] === "(") depth++;
                        if (line[i] === ")") {
                                depth--;
                                if (depth === 0) {
                                        end = i;
                                        break;

                }

            }

        }
                if (end === -1) {
                        return [];

        }
                return line            .slice(start + 1, end)            .split(",")            .map(x => x.trim())            .filter(Boolean)            .map(parameter => {
                            const clean =                    parameter                        .replace(                            /^[*]{0,2}/,                            ""                        )                        .split("=")[0]                        .split(":")[0]                        .trim();
                            return clean;

        });

    }
        parseImportStatement(text) {
                return text            .split(",")            .map(item => {
                            const parts =                    item                        .trim()                        .split(/\s+as\s+/);
                            return {
                                    name:                        parts.length > 1                            ? parts[1]                            : parts[0],                    module: parts[0],                    alias:                        parts.length > 1                            ? parts[1]                            : null
            };

        });

    }
        cleanupInternalProperties(symbols) {
                for (const symbol of symbols) {
                        delete symbol._indentation;
                        this.cleanupInternalProperties(                symbol.children            );

        }

    }

}
/* ============================================================ * 15. FOLDING ENGINE * ============================================================ */class PythonFoldingEngine {
        constructor(source) {
                this.source = source;
                this.lines = source.split("\n");

    }
        getIndentation(line) {
                let count = 0;
                for (const char of line) {
                        if (char === " ") {
                                count++;

            }
             else if (char === "\t") {
                                count += 4;

            }
             else {
                                break;

            }

        }
                return count;

    }
        build() {
                const ranges = [];
                for (            let i = 0;            i < this.lines.length - 1;            i++        ) {
                        const current =                this.lines[i];
                        const trimmed =                current.trim();
                        if (                !trimmed ||                trimmed.startsWith("#")            ) {
                                continue;

            }
                        const currentIndent =                this.getIndentation(current);
                        let end = i;
                        for (                let j = i + 1;                j < this.lines.length;                j++            ) {
                                const next =                    this.lines[j];
                                if (!next.trim()) {
                                        continue;

                }
                                const nextIndent =                    this.getIndentation(next);
                                if (                    nextIndent >                    currentIndent                ) {
                                        end = j;

                }
                 else {
                                        break;

                }

            }
                        if (end > i) {
                                ranges.push({
                                        startLine: i,                    endLine: end
                });

            }

        }
                return ranges;

    }

}
/* ============================================================ * 16. SEMANTIC ANALYZER * ============================================================ */class PythonSemanticAnalyzer {
        constructor(source, tokens, symbols) {
                this.source = source;
                this.tokens = tokens;
                this.symbols = symbols;
                this.declaredNames =            new Map();
                this.collectDeclarations(            symbols        );

    }
        collectDeclarations(symbols) {
                for (const symbol of symbols) {
                        this.declaredNames.set(                symbol.name,                symbol            );
                        if (symbol.metadata?.parameters) {
                                for (                    const parameter of                    symbol.metadata.parameters                ) {
                                        this.declaredNames.set(                        parameter,                        {
                                                    name: parameter,                            kind:                                SymbolKind.PARAMETER
                    });

                }

            }
                        this.collectDeclarations(                symbol.children            );

        }

    }
        analyze() {
                const result = [];
                for (let i = 0; i < this.tokens.length; i++) {
                        const token =                this.tokens[i];
                        let type =                token.type;
                        if (                type ===                PythonTokenType.IDENTIFIER            ) {
                                const declaration =                    this.declaredNames.get(                        token.text                    );
                                if (declaration) {
                                        switch (                        declaration.kind                    ) {
                                                case SymbolKind.CLASS:                            type =                                PythonTokenType.CLASS_NAME;
                                                    break;
                                                case SymbolKind.FUNCTION:                            type =                                PythonTokenType.FUNCTION_NAME;
                                                    break;
                                                case SymbolKind.METHOD:                            type =                                PythonTokenType.METHOD;
                                                    break;
                                                case SymbolKind.PARAMETER:                            type =                                PythonTokenType.PARAMETER;
                                                    break;
                                                case SymbolKind.VARIABLE:                            type =                                PythonTokenType.VARIABLE;
                                                    break;
                                                case SymbolKind.CONSTANT:                            type =                                PythonTokenType.BUILTIN_CONSTANT;
                                                    break;

                    }

                }

            }
                        /*             * Detect call expressions.             */            if (                type ===                    PythonTokenType.IDENTIFIER &&                this.isFollowedByOpenParen(                    i                )            ) {
                                type =                    PythonTokenType.FUNCTION_NAME;

            }
                        /*             * Detect properties.             */            if (                type ===                    PythonTokenType.IDENTIFIER &&                this.isPrecededByDot(i)            ) {
                                type =                    PythonTokenType.PROPERTY;

            }
                        result.push({
                                ...token,                semanticType: type
            });

        }
                return result;

    }
        isFollowedByOpenParen(index) {
                for (            let i = index + 1;            i < this.tokens.length;            i++        ) {
                        const token =                this.tokens[i];
                        if (                token.type ===                PythonTokenType.WHITESPACE            ) {
                                continue;

            }
                        return token.text === "(";

        }
                return false;

    }
        isPrecededByDot(index) {
                for (            let i = index - 1;            i >= 0;            i--        ) {
                        const token =                this.tokens[i];
                        if (                token.type ===                PythonTokenType.WHITESPACE            ) {
                                continue;

            }
                        return token.text === ".";

        }
                return false;

    }

}
/* ============================================================ * 17. DIAGNOSTIC ENGINE * ============================================================ */class PythonDiagnosticEngine {
        constructor(source, tokens) {
                this.source = source;
                this.tokens = tokens;
                this.lines =            source.split("\n");

    }
        analyze() {
                const diagnostics = [];
                this.checkUnclosedDelimiters(            diagnostics        );
                this.checkIndentation(            diagnostics        );
                this.checkBasicSyntax(            diagnostics        );
                return diagnostics;

    }
        checkUnclosedDelimiters(        diagnostics    ) {
                const stack = [];
                const pairs = {
                        "(": ")",            "[": "]",            "{": "}"
        };
                const closing = new Set([            ")",            "]",            "}"        ]);
                for (const token of this.tokens) {
                        if (                token.type !==                PythonTokenType.PUNCTUATION            ) {
                                continue;

            }
                        const text =                token.text;
                        if (pairs[text]) {
                                stack.push({
                                        expected:                        pairs[text],                    token
                });

            }
             else if (                closing.has(text)            ) {
                                if (                    stack.length === 0                ) {
                                        diagnostics.push(                        new Diagnostic({
                                                    message:                                `Unexpected '${text}'`,                            severity:                                DiagnosticSeverity.ERROR,                            line:                                token.line,                            column:                                token.column,                            code:                                "PY001"
                    })                    );
                                        continue;

                }
                                const last =                    stack.pop();
                                if (                    last.expected !== text                ) {
                                        diagnostics.push(                        new Diagnostic({
                                                    message:                                `Expected '${last.expected}' but found '${text}'`,                            severity:                                DiagnosticSeverity.ERROR,                            line:                                token.line,                            column:                                token.column,                            code:                                "PY002"
                    })                    );

                }

            }

        }
                for (const item of stack) {
                        diagnostics.push(                new Diagnostic({
                                    message:                        `Unclosed '${item.token.text}'`,                    severity:                        DiagnosticSeverity.ERROR,                    line:                        item.token.line,                    column:                        item.token.column,                    code:                        "PY003"
            })            );

        }

    }
        checkIndentation(        diagnostics    ) {
                const indentationStack = [0];
                for (            let i = 0;            i < this.lines.length;            i++        ) {
                        const line =                this.lines[i];
                        if (!line.trim()) {
                                continue;

            }
                        let indentation = 0;
                        for (const char of line) {
                                if (char === " ") {
                                        indentation++;

                }
                 else if (                    char === "\t"                ) {
                                        indentation += 4;

                }
                 else {
                                        break;

                }

            }
                        const previous =                indentationStack[                    indentationStack.length - 1                ];
                        if (                indentation > previous            ) {
                                indentationStack.push(                    indentation                );

            }
             else if (                indentation < previous            ) {
                                while (                    indentationStack.length >                        1 &&                    indentation <                        indentationStack[                            indentationStack.length - 1                        ]                ) {
                                        indentationStack.pop();

                }
                                if (                    indentation !==                    indentationStack[                        indentationStack.length - 1                    ]                ) {
                                        diagnostics.push(                        new Diagnostic({
                                                    message:                                "Inconsistent indentation",                            severity:                                DiagnosticSeverity.ERROR,                            line: i,                            column: 0,                            code:                                "PY004"
                    })                    );

                }

            }

        }

    }
        checkBasicSyntax(        diagnostics    ) {
                for (            let i = 0;            i < this.lines.length;            i++        ) {
                        const trimmed =                this.lines[i].trim();
                        if (!trimmed) {
                                continue;

            }
                        /*             * def foo             * should have :             */            if (                /^(?:async\s+)?def\s+/.test(                    trimmed                ) &&                !trimmed.endsWith(":")            ) {
                                diagnostics.push(                    new Diagnostic({
                                            message:                            "Function definition should end with ':'",                        severity:                            DiagnosticSeverity.ERROR,                        line: i,                        column:                            this.lines[i].length,                        code:                            "PY005"
                })                );

            }
                        /*             * class Foo             */            if (                /^class\s+/.test(trimmed) &&                !trimmed.endsWith(":")            ) {
                                diagnostics.push(                    new Diagnostic({
                                            message:                            "Class definition should end with ':'",                        severity:                            DiagnosticSeverity.ERROR,                        line: i,                        column:                            this.lines[i].length,                        code:                            "PY006"
                })                );

            }

        }

    }

}
/* ============================================================ * 18. DEFINITION ENGINE * ============================================================ */class PythonDefinitionProvider {
        constructor(symbols) {
                this.index = new Map();
                this.indexSymbols(symbols);

    }
        indexSymbols(symbols) {
                for (const symbol of symbols) {
                        if (                !this.index.has(                    symbol.name                )            ) {
                                this.index.set(                    symbol.name,                    symbol                );

            }
                        this.indexSymbols(                symbol.children            );

        }

    }
        findDefinition(name) {
                return this.index.get(name) || null;

    }

}
/* ============================================================ * 19. REFERENCE ENGINE * ============================================================ */class PythonReferenceProvider {
        constructor(tokens) {
                this.tokens = tokens;

    }
        findReferences(name) {
                return this.tokens            .filter(                token =>                    token.text === name &&                    token.type !==                        PythonTokenType.COMMENT &&                    token.type !==                        PythonTokenType.STRING            )            .map(token => ({
                            line: token.line,                column: token.column,                startOffset:                    token.startOffset,                endOffset:                    token.endOffset
        }));

    }

}
/* ============================================================ * 20. IMPORT ANALYZER * ============================================================ */class PythonImportAnalyzer {
        constructor(source) {
                this.source = source;
                this.lines =            source.split("\n");

    }
        analyze() {
                const imports = [];
                for (            let i = 0;            i < this.lines.length;            i++        ) {
                        const line =                this.lines[i].trim();
                        const direct =                line.match(                    /^import\s+(.+)$/                );
                        if (direct) {
                                for (                    const item of                    direct[1].split(",")                ) {
                                        const parts =                        item                            .trim()                            .split(                                /\s+as\s+/                            );
                                        imports.push({
                                                type: "import",                        module: parts[0],                        alias:                            parts[1] || null,                        line: i
                    });

                }

            }
                        const from =                line.match(                    /^from\s+(.+?)\s+import\s+(.+)$/                );
                        if (from) {
                                const module =                    from[1];
                                const names =                    from[2]                        .split(",")                        .map(x => x.trim());
                                for (const item of names) {
                                        const parts =                        item.split(                            /\s+as\s+/                        );
                                        imports.push({
                                                type: "from",                        module,                        name: parts[0],                        alias:                            parts[1] || null,                        line: i
                    });

                }

            }

        }
                return imports;

    }

}
/* ============================================================ * 21. PYTHON DOCUMENT * ============================================================ */class PythonDocument {
        constructor(        uri,        source = "",        version = 0    ) {
                this.uri = uri;
                this.source = source;
                this.version = version;
                this.lineIndex =            new LineIndex(source);
                this.tokens = [];
                this.symbols = [];
                this.semanticTokens = [];
                this.foldingRanges = [];
                this.diagnostics = [];
                this.imports = [];

    }
        analyze() {
                /*         * Lexical analysis.         */        const lexer =            new PythonLexer(                this.source            );
                this.tokens =            lexer.lex();
                /*         * Symbol analysis.         */        const symbolAnalyzer =            new PythonSymbolAnalyzer(                this.source,                this.tokens            );
                this.symbols =            symbolAnalyzer.build();
                /*         * Semantic analysis.         */        const semanticAnalyzer =            new PythonSemanticAnalyzer(                this.source,                this.tokens,                this.symbols            );
                this.semanticTokens =            semanticAnalyzer.analyze();
                /*         * Folding.         */        const foldingEngine =            new PythonFoldingEngine(                this.source            );
                this.foldingRanges =            foldingEngine.build();
                /*         * Diagnostics.         */        const diagnosticEngine =            new PythonDiagnosticEngine(                this.source,                this.tokens            );
                this.diagnostics =            diagnosticEngine.analyze();
                /*         * Imports.         */        const importAnalyzer =            new PythonImportAnalyzer(                this.source            );
                this.imports =            importAnalyzer.analyze();
                return this;

    }
        applyEdit(        startOffset,        endOffset,        replacement    ) {
                this.source =            this.source.slice(                0,                startOffset            ) +            replacement +            this.source.slice(                endOffset            );
                this.version++;
                this.lineIndex =            new LineIndex(                this.source            );
                /*         * Current implementation performs         * a complete analysis after editing.         *         * The public API intentionally allows         * a future incremental parser to replace         * this behavior.         */        return this.analyze();

    }

}
/* ============================================================ * 22. MAIN PYTHON LANGUAGE SERVICE * ============================================================ */class StarlightPythonExtension {
        constructor(options = {
        }) {
                this.id =            options.id ||            "starlight.python";
                this.name =            options.name ||            "Python";
                this.version =            STARLIGHT_PYTHON_EXTENSION_VERSION;
                this.documents =            new Map();

    }
        openDocument(        uri,        source    ) {
                const document =            new PythonDocument(                uri,                source,                1            );
                document.analyze();
                this.documents.set(            uri,            document        );
                return document;

    }
        getDocument(uri) {
                return this.documents.get(uri) || null;

    }
        closeDocument(uri) {
                this.documents.delete(uri);

    }
        updateDocument(        uri,        startOffset,        endOffset,        replacement    ) {
                const document =            this.getDocument(uri);
                if (!document) {
                        throw new Error(                `Document not open: ${uri}`            );

        }
                return document.applyEdit(            startOffset,            endOffset,            replacement        );

    }
        tokenize(source) {
                const lexer =            new PythonLexer(source);
                return lexer.lex();

    }
        getOutline(source) {
                const document =            new PythonDocument(                "memory://outline.py",                source            );
                document.analyze();
                return document.symbols;

    }
        getSemanticTokens(source) {
                const document =            new PythonDocument(                "memory://semantic.py",                source            );
                document.analyze();
                return document.semanticTokens;

    }
        getDiagnostics(source) {
                const document =            new PythonDocument(                "memory://diagnostics.py",                source            );
                document.analyze();
                return document.diagnostics;

    }
        getFoldingRanges(source) {
                const engine =            new PythonFoldingEngine(                source            );
                return engine.build();

    }
        getImports(source) {
                const analyzer =            new PythonImportAnalyzer(                source            );
                return analyzer.analyze();

    }
        findDefinition(        source,        name    ) {
                const document =            new PythonDocument(                "memory://definition.py",                source            );
                document.analyze();
                const provider =            new PythonDefinitionProvider(                document.symbols            );
                return provider.findDefinition(            name        );

    }
        findReferences(        source,        name    ) {
                const tokens =            this.tokenize(source);
                const provider =            new PythonReferenceProvider(                tokens            );
                return provider.findReferences(            name        );

    }
        getDocumentSymbols(source) {
                return this.getOutline(source);

    }
        analyze(source) {
                const document =            new PythonDocument(                "memory://document.py",                source            );
                document.analyze();
                return {
                        version: document.version,            tokens: document.tokens,            semanticTokens:                document.semanticTokens,            symbols:                document.symbols,            diagnostics:                document.diagnostics,            foldingRanges:                document.foldingRanges,            imports:                document.imports
        };

    }

}
/* ============================================================ * 23. EXTENSION FACTORY * ============================================================ */function createStarlightPythonExtension(    options = {
    }) {
        return new StarlightPythonExtension(        options    );

}
/* ============================================================ * 24. PUBLIC API * ============================================================ */const StarlightPython = Object.freeze({
        version:        STARLIGHT_PYTHON_EXTENSION_VERSION,    PythonTokenType,    SymbolKind,    DiagnosticSeverity,    PythonToken,    SymbolNode,    Diagnostic,    Position,    Range,    PythonLexer,    PythonSymbolAnalyzer,    PythonSemanticAnalyzer,    PythonDiagnosticEngine,    PythonFoldingEngine,    PythonImportAnalyzer,    PythonDefinitionProvider,    PythonReferenceProvider,    PythonDocument,    StarlightPythonExtension,    createStarlightPythonExtension
});
/* ============================================================ * 25. EXPORT * ============================================================ * * Supports: * * CommonJS * ES Modules * Browser/global usage * ============================================================ */if (    typeof module !== "undefined" &&    module.exports) {
        module.exports =        StarlightPython;

}
if (    typeof globalThis !== "undefined") {
        globalThis.StarlightPython =        StarlightPython;

}
