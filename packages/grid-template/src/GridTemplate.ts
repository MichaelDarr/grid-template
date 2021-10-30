/*──────────────┰┬┰┬┰┬┰─┰┰┰─┬┬─┬─┬┬─┬┬─┐
 │ GridTemplate ╿╽╿╽╿╽┞╫┃┇┃╫┤|╷╵|╷├╫┤├╫│
 ├╼┱╼┱╼┱╼┱╼┱╼┱╼┱┶╉┶╉┶╉┶┱┺╉┺┱┶┱┶╅╼┱┶┱┶╅╼┥
 ┝┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓┗┓│
 ├┺┭╊┱╊┭┺╾╊┱╊┱┺╾╊┭╊┭╊┭╊╾╊┱╊╾╄┯┺┭┺┭╄╾╄┭┺┥
 ├┍┵┡┹┡┵┍╾╽╆╅╽┍╾╿╽╿╽╿╽┞╾┨┇┠╾|╷|╵╷╵├╾┝┵┍┤
 ├┙┬┧┲┧┮┙╼┪╆╅╽┙╼╽╿╽╿╽╿╽╼┨┋┠╼┤|╵╷╵╷|╼┥┮┙┤
 ┝┯┿╇╇╇┿┯┯┿┿┿┿┯┯┩╽╿╽╿╽┡┯╇╇╇┯┿┯┿┿┯┯┿┯┿┿┯┥
 │╡═╞ ╡═╞ ╡═╞ ╡═╽╿╽╿╽╿╽╡═╞ ╡═╞ ╡═╞ ╡═╞ ╡
 ┝┷┿╈╈╈┿┷┷╈╈╈╈┷┷┩╽╿╽╿╽┞┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┥
 ├╭│┃┃┃├╭╭╽╆╅╽╭╭╽╿╽╿╽╿╽ > Hey, that's  │
 │╯┤┃┃┃│╯╯╽╆╅╽╯╯┦╽╿╽╿╽╿   pretty neat! │
 └─┴┸┸┸┴──┴┴┴┴──┴┸┴┸┴┸┴────────────────*/

/* eslint-disable array-bracket-spacing, @typescript-eslint/indent */

/**
 * Named grid area
 * https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas
 */
type Area = string;

/**
 * Grid track size
 * https://developer.mozilla.org/en-US/docs/Glossary/Grid_Tracks
 */
type Size = string;

/**
 * The empty grid corner where row heights intersect column widths
 * https://github.com/1build/1build/wiki/CSS-Grids
 */
type Bare = '';
const bare: Bare = '';

/**
 * The internal grid layout is stored with column widths and row heights
 * above and to the left of the template area, directly opposite of how they
 * are represented within the `grid-template` property. This arrangement
 * provides type-safe access to the measurements via destructuring.
 */
type Layout = [
    [Bare, ...Size[]],
 ...[Size, ...Area[]][]
];

/**
 * To generate a valid `grid-template` property, we first need to normalize the
 * flipped internal layout to mirror that of standard CSS.
 */
type CSSLayout = [
 ...[...Area[], Size][],
    [...Size[], Bare]
];

export class GridTemplate {
    /**
     * A matrix containing raw grid template data
     */
    private _layout: Layout;

    /**
     * Grid templates are initialized with a single cell. Its template area,
     * width, and height can be passed as options. It defaults to an empty grid
     * cell (`.`) with a width and height of `1fr`.
     */
    constructor(options: {
        area?: Area,
        columnSize?: Size,
        rowSize?: Size,
    } = {}) {
        const {
            area = '.',
            columnSize = '1fr',
            rowSize = '1fr',
        } = options;
        this._layout = [
            [bare   , columnSize],
            [rowSize, area      ],
        ];
    }

    /**
     * A CSS `grid-template` property value which renders this grid
     */
    public get css(): string {
        const columnWidths = Array.from(
            { length: this.columns },
            (_, i) => this.maxStringLengthInColumn(i),
        );
        return this.layout.reduce((layoutAcc, row, rowIndex, { length: rowsLength }) => {
            const isFinalRow = rowIndex === rowsLength-1;
            const rowString = row.reduce((rowAcc, value, valueIndex, { length: valuesLength }) => {
                const valueStrings = [rowAcc];
                const columnsLeft = valuesLength-valueIndex-1;
                if (columnsLeft !== 0 || !isFinalRow) {
                    valueStrings.push(' ');
                    valueStrings.push(value.padEnd(columnWidths[valueIndex]));
                }
                if (columnsLeft > 0) {
                    valueStrings.push(' ');
                }
                if (columnsLeft === 1 && !isFinalRow) {
                    valueStrings.push('"');
                }
                return valueStrings.join('');
            }, isFinalRow ? '/' : '"');
            return `${layoutAcc}\n${rowString}`;
        }, '');
    }

    /**
     * Raw layout data in the shape of a CSS `grid-template`
     */
    public get layout(): CSSLayout {
        const [[, ...columnWidths], ...rows] = this._layout;
        const normalizedRows = rows.map<[...Area[], Size]>(([size, ...areas]) => (
            [...areas, size]
        ));
        return [...normalizedRows, [...columnWidths, bare]];
    }

    /**
     * Adds a column to the grid template
     */
    public addColumn(
        area: Area,
        size: Size,
        options: {
            position?: 'left'|'right'|number,
        } = {},
    ): void {
        let columnIndex: number;
        switch(options.position) {
            case undefined:
            case 'right':
                columnIndex = this.getColumnLayoutIndex(-1)+1;
                break;
            case 'left':
                columnIndex = this.getColumnLayoutIndex(0);
                break;
            default:
                columnIndex = this.getColumnLayoutIndex(options.position);
        }
        for (let rowIndex = 0; rowIndex < this._layout.length; rowIndex++) {
            const value = rowIndex === 0 ? size : area;
            this._layout[rowIndex].splice(columnIndex, 0, value);
        }
    }

    /**
     * Adds a row to the grid template
     */
    public addRow(
        area: Area,
        size: Size,
        options: {
            position?: 'top'|'bottom'|number,
        } = {},
    ): void {
        let rowIndex: number;
        switch(options.position) {
            case undefined:
            case 'bottom':
                rowIndex = this.getRowLayoutIndex(-1)+1;
                break;
            case 'top':
                rowIndex = this.getRowLayoutIndex(0);
                break;
            default:
                rowIndex = this.getRowLayoutIndex(options.position);
        }
        const templateAreas: Area[] = Array.from(
            { length: this.columns },
            () => area
        );
        this._layout.splice(rowIndex, 0, [size, ...templateAreas]);
    }

    /**
     * The number of columns in the template
     * The row height column is not included in the count.
     */
    private get columns(): number {
        return this._layout[this.rows].length-1;
    }

    /**
     * The number of rows in the template
     * The column width row is not included in the count.
     */
    private get rows(): number {
        return this._layout.length-1;
    }

    /**
     * Transforms a zero-based column index to its index within `_layout` rows
     * Supports negative indeces (passing `-1` yeilds the final column's index) 
     */
    private getColumnLayoutIndex(columnIndexZeroBased: number): number {
        let layoutIndex = columnIndexZeroBased+1;
        if (columnIndexZeroBased < 0) {
            layoutIndex += this.columns;
        }
        if (layoutIndex < 0 || layoutIndex > this.columns) {
            throw new Error(`column layout index out of bounds: ${columnIndexZeroBased}`);
        }
        return layoutIndex;
    }

    /**
     * Transforms a zero-based row index to its index within `_layout`
     * Supports negative indeces (passing `-1` yeilds the final row's index) 
     */
    private getRowLayoutIndex(rowIndexZeroBased: number): number {
        let layoutIndex = rowIndexZeroBased+1;
        if (rowIndexZeroBased < 0) {
            layoutIndex += this.rows;
        }
        if (layoutIndex < 0 || layoutIndex > this.rows) {
            throw new Error(`row layout index out of bounds: ${rowIndexZeroBased}`);
        }
        return layoutIndex;
    }

    /**
     * The value at the passed indexes
     */
    private layoutValue(
        columnIndex: number,
        rowIndex: number,
    ): string {
        const columnLayoutIndex = this.getColumnLayoutIndex(columnIndex);
        const rowLayoutIndex = this.getRowLayoutIndex(rowIndex);
        return this._layout[rowLayoutIndex][columnLayoutIndex];
    }

    /**
     * Returns the length of the longest string within a column
     */
    private maxStringLengthInColumn(columnIndex: number): number {
        let max = 0;
        for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
            const { length } = this.layoutValue(columnIndex, rowIndex);
            max = Math.max(max, length);
        }
        return max;
    }
}
