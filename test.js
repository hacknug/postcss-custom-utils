const fs = require('fs')
const utils = require('.')
const postcss = require('postcss')

describe('transformStringWith* from various sources', () => {
	const testContent = utils.readCustom.sync(
		'./test/custom.css',
		'./test/custom.js',
		{ customProperties: { '--length-3': '20px' } },
	);

	const testSources = Object.entries({
		customMedia: {
			source: 'all and (--mq-a)',
			expect: 'all and (max-width: 30em),all and (max-height: 30em)',
			result: utils.transformStringWithCustomMedia,
		},
		customProperties: {
			source: 'var(--length-1) var(--length-2) var(--length-3)',
			expect: '10px 15px 20px',
			result: utils.transformStringWithCustomProperties,
		},
		customSelectors: {
			source: ':--any-heading + p {}',
			expect: 'h1 + p {},h2 + p {},h3 + p {},h4 + p {},h5 + p {},h6 + p {}',
			result: utils.transformStringWithCustomSelectors,
		},
	});

	test.each(testSources)('%s', (description, testParams) => {
		const { source: testSource, expect: testExpect, result: resultUtil } = testParams;

		const testResult = resultUtil(testSource, testContent[description]);

		return expect(testResult).toBe(testExpect);
	});
});

describe('transformStringWith* from an object', () => {
	const testContent = utils.readCustomFromObject({
		customMedia: { '--mq-a': '(max-width: 30em), (max-height: 30em)' },
		customProperties: { '--length-0': '5px' },
		customSelectors: { ':--any-heading': 'h1, h2, h3, h4, h5, h6' }
	});

	const testSources = Object.entries({
		customMedia: {
			source: 'all and (--mq-a)',
			expect: 'all and (max-width: 30em),all and (max-height: 30em)',
			result: utils.transformStringWithCustomMedia,
		},
		customProperties: {
			source: 'var(--length-0)',
			expect: '5px',
			result: utils.transformStringWithCustomProperties,
		},
		customSelectors: {
			source: ':--any-heading + p {}',
			expect: 'h1 + p {},h2 + p {},h3 + p {},h4 + p {},h5 + p {},h6 + p {}',
			result: utils.transformStringWithCustomSelectors,
		},
	});

	test.each(testSources)('%s', (description, testParams) => {
		const { source: testSource, expect: testExpect, result: resultUtil } = testParams

		const testResult = resultUtil(testSource, testContent[description]);

		return expect(testResult).toBe(testExpect);
	});
});

describe('transformStringWith* from a json file', () => {
	const testContent = utils.readCustomFromJsonFile.sync('./test/custom.json');

	const testSources = Object.entries({
		customMedia: {
			source: 'all and (--mq-a)',
			expect: 'all and (max-width: 30em),all and (max-height: 30em)',
			result: utils.transformStringWithCustomMedia,
		},
		customProperties: {
			source: 'var(--length-4)',
			expect: '25px',
			result: utils.transformStringWithCustomProperties,
		},
		customSelectors: {
			source: ':--heading + p {}',
			expect: 'h1 + p {},h2 + p {},h3 + p {}',
			result: utils.transformStringWithCustomSelectors,
		},
	})

	test.each(testSources)('%s', (description, testParams) => {
		const { source: testSource, expect: testExpect, result: resultUtil } = testParams

		const testResult = resultUtil(testSource, testContent[description]);

		return expect(testResult).toBe(testExpect);
	})
});

describe('transformStringWith* from a PostCSS-processed string', () => {
	const testCustomCss = `
		@custom-media --mq-a (max-width: 30em), (max-height: 30em);
		@custom-selector :--any-heading h1, h2, h3, h4, h5, h6;
		:root { --length-5: 10px; }`;
	const testContent = utils.readCustomFromRoot(
		postcss.parse(testCustomCss, { from: 'noop.css' })
	);

	const testSources = Object.entries({
		customMedia: {
			source: 'all and (--mq-a)',
			expect: 'all and (max-width: 30em),all and (max-height: 30em)',
			result: utils.transformStringWithCustomMedia,
		},
		customProperties: {
			source: 'var(--length-5)',
			expect: '10px',
			result: utils.transformStringWithCustomProperties,
		},
		customSelectors: {
			source: ':--any-heading + p {}',
			expect: 'h1 + p {},h2 + p {},h3 + p {},h4 + p {},h5 + p {},h6 + p {}',
			result: utils.transformStringWithCustomSelectors,
		},
	});

	test.each(testSources)('%s', (description, testParams) => {
		const { source: testSource, expect: testExpect, result: resultUtil } = testParams;

		const testResult = resultUtil(testSource, testContent[description]);

		return expect(testResult).toBe(testExpect);
	});
});


describe('writeCustom exports different formats', () => {
	const testContent = utils.readCustomFromObject({
		customMedia: { '--mq-a': '(max-width: 30em), (max-height: 30em)' },
		customProperties: { '--length-0': '5px' },
		customSelectors: { ':--heading': 'h1, h2, h3' },
	});

	const testSources = Object.entries({
		css: '',
		js: '',
		json: '',
		mjs: '',
	});

	test.each(testSources)('%s', (extension) => {
		const path = `test/export.${extension}`;

		fs.existsSync(path) && fs.unlinkSync(path);

		const testResult = fs.existsSync(path);

		utils.writeCustom.sync(testContent, path);

		const testExpect = fs.existsSync(path);

		return expect(testResult).not.toBe(testExpect);
	});
});

describe('readCustom imports different formats', () => {
	const testContent = Object.entries({
		css: `
			@custom-media --mq-a (max-width: 30em), (max-height: 30em);
			@custom-selector :--heading h1, h2, h3;
			:root { --length-0: 5px; }
		`,
		js: `module.exports = {
			customMedia: { '--mq-a': '(max-width: 30em), (max-height: 30em)' },
			customSelectors: { ':--heading': 'h1, h2, h3' },
			customProperties: { '--length-0': '5px' }
		};`,
		json: `{
			"custom-media": { "--mq-a": "(max-width: 30em), (max-height: 30em)" },
			"custom-properties": { "--length-0": "5px" },
			"custom-selectors": { ":--heading": "h1, h2, h3" }
		}`,
		mjs: `
			export const customMedia = { '--mq-a': '(max-width: 30em), (max-height: 30em)' };
			export const customSelectors = { ':--heading': 'h1, h2, h3' };
			export const customProperties = { '--length-0': '5px' };
		`,
	});

	test.each(testContent)('%s', (extension, testExpect) => {
		const path = `test/export.${extension}`
		const testResult = fs.readFileSync(path, 'utf8');

		return expect(testResult.replace(/\s/g, '')).toBe(testExpect.replace(/\s/g, ''));
	})
})

// describe('transformRootWith*', () => {
// 	test.todo('add tests for all of these methods')
// })
