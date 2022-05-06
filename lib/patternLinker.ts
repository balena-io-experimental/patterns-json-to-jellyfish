import * as path from 'path';
import { getSdk, JellyfishSDK } from '@balena/jellyfish-client-sdk';

export class PatternLinker {
	sdk: JellyfishSDK;
	patternsDiagnostics: { [key: string]: any } | undefined = undefined;
	config: { [key: string]: any } | undefined = undefined;
	constructor() {
		this.sdk = getSdk({
			apiUrl: 'https://api.ly.fish',
			apiPrefix: 'api/v2/',
		});
	}

	private async loadJsonFromFile(filename: string) {
		const filePath = path.resolve(filename);
		const { ext: fileExtension } = path.parse(filename);
		switch (fileExtension) {
			case '.json':
				return require(filePath);
			default:
				throw Error(
					`Unrecognised symptom file extension, skipping: ${fileExtension}`,
				);
		}
	}

	private async getIdFromSlug(slug: string) {
		try {
			const result = await this.sdk.query(
				{
					type: 'object',
					properties: {
						slug: {
							type: 'string',
							const: slug,
						},
					},
				},
				{ limit: 1 },
			);

			return result[0]?.id;
		} catch (err) {
			console.error(`err: ${err} `);
			return '';
		}
	}

	private async linkPatternToThread(spThreadId: string, patternId: string) {
		const action = {
			card: 'link',
			type: 'type',
			action: 'action-create-card@1.0.0',
			arguments: {
				reason: null,
				properties: {
					name: 'has attached',
					data: {
						inverseName: 'is attached to',
						from: {
							id: spThreadId,
							type: 'support-thread@1.0.0',
						},
						to: {
							id: patternId,
							type: 'pattern@1.0.0',
						},
					},
				},
			},
		};

		try {
			await this.sdk.action(action);
		} catch (err) {
			console.error(`err: ${err} `);
		}
	}

	private async addDiagnosticsWhisperToSupportThread(
		spThreadId: string,
		message: string,
	) {
		const action = {
			card: spThreadId,
			type: 'support-thread@1.0.0',
			action: 'action-create-event@1.0.0',
			arguments: {
				payload: {
					mentionsUser: [],
					alertsUser: [],
					mentionsGroup: [],
					alertsGroup: [],
					message: message,
				},
				tags: [],
				type: 'whisper',
			},
		};

		try {
			await this.sdk.action(action);
		} catch (err) {
			console.error(`err: ${err} `);
		}
	}

	private async linkPatterns(spThreadId: string, results: any) {
		for await (const singlePatterResult of results) {
			if (singlePatterResult.permalinkPattern) {
				const permalinkParts = singlePatterResult.permalinkPattern.split('/');
				const patternSlug = permalinkParts[permalinkParts.length - 1];
				const patternId = await this.getIdFromSlug(patternSlug);
				if (spThreadId && patternId) {
					await this.linkPatternToThread(spThreadId, patternId);
				}
			}
		}
	}

	private async createDiagnosticsWhisper(spThreadId: string, results: any) {
		const allPatternsWhisperMessage = `Diagnostics linking patterns: `;
		const whisperMessage = results.reduce(
			(prev: any, curr: any) =>
				prev +
				`\n ${curr.title ? '#### ' + curr.title + '\n' : ''} ${
					curr.permalinkPattern
				}`,
			allPatternsWhisperMessage,
		);

		await this.addDiagnosticsWhisperToSupportThread(spThreadId, whisperMessage);
	}

	async loadPatternDiagnosticsFromFile(filename: string) {
		this.patternsDiagnostics = await this.loadJsonFromFile(filename);
	}

	async loadConfiguration(filename: string) {
		this.config = await this.loadJsonFromFile(filename);
	}

	async link() {
		if (this.patternsDiagnostics === undefined || this.config === undefined) {
			throw Error(
				`load file and config before linking patterns to support thread`,
			);
		}
		const results = Object.values(this.patternsDiagnostics.results).filter(
			(singlePatterResult: any) => {
				const shouldLinkFilter = Object.values(singlePatterResult).reduce(
					(prev: any, curr: any) => prev && (curr.value ?? true),
					true,
				);
				return shouldLinkFilter;
			},
		);

		if (results.length > 0) {
			const spThreadId = await this.getIdFromSlug(
				this.config?.supportThreadSlug,
			);
			await this.createDiagnosticsWhisper(spThreadId, results);
			await this.linkPatterns(spThreadId, results);
		}
	}

	async init(config: {
		auth_token?: string;
		username?: string;
		password?: string;
	}) {
		if (config.username && config.password) {
			await this.sdk.auth.login({
				username: config.username,
				password: config.password,
			});
		} else if (config.auth_token) {
			this.sdk.setAuthToken(config.auth_token);
		}
	}
}
