import { supabaseClient } from "./client";

const BUCKET = "word-images";

export async function uploadWordImage(
	file: File,
	wordId: string,
): Promise<string> {
	const ext = file.name.split(".").pop() ?? "png";
	const path = `${wordId}/${Date.now()}.${ext}`;

	const { error: uploadError } = await supabaseClient.storage
		.from(BUCKET)
		.upload(path, file, {
			cacheControl: "31536000",
			upsert: true,
		});
	if (uploadError) throw new Error(`Upload image: ${uploadError.message}`);

	const { data: publicUrl } = supabaseClient.storage
		.from(BUCKET)
		.getPublicUrl(path);

	return publicUrl.publicUrl;
}

export function getWordImageUrl(path: string): string {
	const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(path);
	return data.publicUrl;
}

export async function deleteWordImage(imageUrl: string): Promise<void> {
	const path = imageUrl.split("/").pop();
	if (!path) return;

	const { error } = await supabaseClient.storage
		.from(BUCKET)
		.remove([`${imageUrl.split(`/${BUCKET}/`)[1] ?? path}`]);
	if (error) throw new Error(`Delete image: ${error.message}`);
}

export async function deleteWordImagesByWordId(wordId: string): Promise<void> {
	const { data, error: listError } = await supabaseClient.storage
		.from(BUCKET)
		.list(wordId);
	if (listError) return;

	const paths = (data ?? []).map((f) => `${wordId}/${f.name}`);
	if (paths.length === 0) return;

	const { error } = await supabaseClient.storage.from(BUCKET).remove(paths);
	if (error) throw new Error(`Delete word images: ${error.message}`);
}
