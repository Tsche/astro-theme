export interface SourceRange {
  startLine?: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
}

export interface GodboltOptions {
  url?: string;
  baseUrl?: string;
  language?: string;
  compiler?: string;
  options?: string;
  source?: string;
  filename?: string;
  execute?: boolean;
}

export function parseSourceRange(value?: string): SourceRange | undefined {
  if (!value) return undefined;
  const match = /^(\d+)(?::(\d+))?-(\d+)(?::(\d+))?$/.exec(value);
  if (!match) throw new Error(`Invalid source range “${value}”`);
  const range = {
    startLine: Number(match[1]),
    startColumn: match[2] ? Number(match[2]) : undefined,
    endLine: Number(match[3]),
    endColumn: match[4] ? Number(match[4]) : undefined,
  };
  if (range.endLine < range.startLine)
    throw new Error(`Invalid source range “${value}”`);
  return range;
}

export function selectSource(source: string, range?: SourceRange): string {
  if (!range) return source;
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const start = Math.max(0, (range.startLine ?? 1) - 1);
  const end = Math.min(lines.length, range.endLine ?? lines.length);
  const selected = lines.slice(start, end);
  if (!selected.length) return "";
  if (range.startColumn) selected[0] = selected[0].slice(range.startColumn - 1);
  if (range.endColumn) {
    const last = selected.length - 1;
    const firstLineOffset = last === 0 ? (range.startColumn ?? 1) - 1 : 0;
    selected[last] = selected[last].slice(
      0,
      Math.max(0, range.endColumn - 1 - firstLineOffset),
    );
  }
  return selected.join("\n");
}

export function visibleHighlightRanges(
  value: string | undefined,
  range?: SourceRange,
): string[] {
  if (!value) return [];
  const offset = (range?.startLine ?? 1) - 1;
  const visibleEnd = range?.endLine ?? Number.POSITIVE_INFINITY;
  const result: string[] = [];
  for (const part of value.split(",").map((item) => item.trim())) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!match) throw new Error(`Invalid highlighted line range “${part}”`);
    const start = Math.max(Number(match[1]), offset + 1);
    const end = Math.min(Number(match[2] ?? match[1]), visibleEnd);
    if (start <= end)
      result.push(
        start === end
          ? String(start - offset)
          : `${start - offset}-${end - offset}`,
      );
  }
  return result;
}

export function createGodboltUrl(
  renderedSource: string,
  options: GodboltOptions = {},
): string {
  if (options.url) return options.url;
  const source = options.source ?? renderedSource;
  const compiler = options.compiler ?? "clang2110";
  const compilerOptions =
    options.options ?? "-std=c++2c -Wall -Wextra -pedantic-errors";
  const execute = options.execute ?? false;
  const filters = {
    binary: false,
    binaryObject: false,
    commentOnly: true,
    demangle: true,
    directives: true,
    execute,
    intel: true,
    labels: true,
    libraryCode: false,
    trim: false,
    debugCalls: false,
  };
  const state = {
    sessions: [
      {
        id: 1,
        language: options.language ?? "c++",
        source,
        filename: options.filename ?? "example.cpp",
        compilers: [
          {
            id: compiler,
            options: compilerOptions,
            filters,
            libs: [],
            specialoutputs: [],
            tools: [],
            overrides: [],
          },
        ],
        executors: [],
      },
    ],
    trees: [],
  };
  const encoded = Buffer.from(JSON.stringify(state), "utf8").toString(
    "base64url",
  );
  const base = new URL(options.baseUrl ?? "https://godbolt.org/");
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  return new URL(`clientstate/${encoded}`, base).href;
}
