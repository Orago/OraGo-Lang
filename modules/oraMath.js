import { valuePostProcessor, customExtension } from '../ora/util/extensions.js';

const oraComparison = new customExtension({
	processors: [
		// Greater Than
		new valuePostProcessor({
			validate ({ iter }){
				const { keywords: kw } = this;
				return iter.disposeIf(next => kw.is(next, kw.id.greater_than));
			},
			parse ({ iter, value, scope }){
				return value > this.parseNext(iter, scope);
			}
		}),

		// Less Than
		new valuePostProcessor({
			validate ({ iter }){
				const { keywords: kw } = this;
				return iter.disposeIf(next => kw.is(next, kw.id.less_than));
			},
			parse ({ iter, value, scope }){
				return value < this.parseNext(iter, scope);
			}
		}),
	]
});

export { oraComparison };