import { PatternLinker } from './patternLinker';

const patternLinker = new PatternLinker();

const exec = async () => {
	await patternLinker.init({ auth_token: process.env.JF_AUTH_TOKEN });
	await patternLinker.loadPatternDiagnosticsFromFile(
		'input/out_diagnostics.json',
	);
	await patternLinker.loadConfiguration('input/config.json');
	await patternLinker.link();
};

exec();
