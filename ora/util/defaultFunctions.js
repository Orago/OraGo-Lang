function handleLoop ({ iter, handleItems }){
	const input = iter.next().value, 
				items = [...iter];

	if (!isNaN(input)) {
		const timesToRun = this.utils.forceType.forceNumber(input);

		for (let i = 0; i < timesToRun; i++)
			handleItems(
				this.iterable(
					items,
					{ tracking: true }
				),
				this
			);
	}
	else throw 'Cannot Find Loop Status';
};


export default function ({ kw }){
	return {
		[kw.id.comment]: () => ({ break: true }),
		[kw.id.loop]: handleLoop,
	};
};