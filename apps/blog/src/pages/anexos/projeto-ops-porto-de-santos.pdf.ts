import part01 from '../../assets/ops-pdf/part-01.b64?raw';
import part02 from '../../assets/ops-pdf/part-02.b64?raw';
import part03 from '../../assets/ops-pdf/part-03.b64?raw';
import part04 from '../../assets/ops-pdf/part-04.b64?raw';
import part05 from '../../assets/ops-pdf/part-05.b64?raw';
import part06 from '../../assets/ops-pdf/part-06.b64?raw';
import part07 from '../../assets/ops-pdf/part-07.b64?raw';
import part08 from '../../assets/ops-pdf/part-08.b64?raw';
import part09 from '../../assets/ops-pdf/part-09.b64?raw';
import part10 from '../../assets/ops-pdf/part-10.b64?raw';
import part11 from '../../assets/ops-pdf/part-11.b64?raw';
import part12 from '../../assets/ops-pdf/part-12.b64?raw';
import part13 from '../../assets/ops-pdf/part-13.b64?raw';

export const prerender = true;

function decodeBase64(input: string) {
	const normalized = input.replace(/\s+/g, '');
	const binary = atob(normalized);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

const pdf = decodeBase64([
	part01, part02, part03, part04, part05, part06, part07,
	part08, part09, part10, part11, part12, part13,
].join(''));

export function GET() {
	return new Response(pdf, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'inline; filename="projeto-ops-porto-de-santos.pdf"',
			'Cache-Control': 'public, max-age=31536000, immutable',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}
