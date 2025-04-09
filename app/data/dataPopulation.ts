const sampleGraphs = new Map<string, string>();

const HeawoodGraph = `
p tw 14 21
1 2
1 6
1 10
2 3
2 7
3 4
4 5
5 6
7 8
7 12
8 5
8 9
9 10
9 14
10 11
11 4
11 12
12 13
13 6
13 14
14 3
`;

const PappusGraph = `
p tw 18 27
1 2
1 14
1 15
2 11
2 16
3 8
3 10
4 5
4 9
5 8
6 9
7 10
11 12
11 17
12 13
12 18
13 3
13 14
14 4
15 6
15 10
16 5
16 7
17 6
17 8
18 7
18 9`;

const GrotzschGraph = `
p tw 11 20
1 2
1 4
1 5
1 6
1 7
2 3
2 9
4 8
4 10
5 9
5 11
6 3
6 10
7 8
7 11
8 3
8 9
9 10
10 11
11 3`;

sampleGraphs.set("GrotzschGraph", GrotzschGraph);
sampleGraphs.set("HeawoodGraph", HeawoodGraph);
sampleGraphs.set("PappusGraph", PappusGraph);

export function populateGraphData(key: string) {
	return sampleGraphs.get(key) ?? "";
}
