import { useForm } from "@tanstack/react-form";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAddWord } from "@/hooks/queries";

const addWordSchema = z.object({
	hanzi: z
		.string()
		.trim()
		.min(1, "Vui lòng nhập chữ Hán.")
		.max(10, "Chữ Hán tối đa 10 ký tự."),
	pinyin: z
		.string()
		.trim()
		.min(1, "Vui lòng nhập pinyin.")
		.max(50, "Pinyin tối đa 50 ký tự."),
	meaning: z
		.string()
		.trim()
		.min(1, "Vui lòng nhập nghĩa.")
		.max(200, "Nghĩa tối đa 200 ký tự."),
	radical: z.string().trim().max(20, "Bộ thủ tối đa 20 ký tự.").optional(),
	etymology: z
		.string()
		.trim()
		.max(500, "Chiết tự tối đa 500 ký tự.")
		.optional(),
	example: z.string().trim().max(200, "Ví dụ tối đa 200 ký tự.").optional(),
});

export function AddWordDialog() {
	const [open, setOpen] = useState(false);
	const { mutate: addWord, isPending } = useAddWord();

	const form = useForm({
		defaultValues: {
			hanzi: "",
			pinyin: "",
			meaning: "",
			radical: "",
			etymology: "",
			example: "",
		},
		validators: {
			onSubmit: addWordSchema,
		},
		onSubmit: async ({ value }) => {
			addWord(
				{
					hanzi: value.hanzi.trim(),
					pinyin: value.pinyin.trim(),
					meaning: value.meaning.trim(),
					radical: value.radical?.trim() || undefined,
					etymology: value.etymology?.trim() || undefined,
					example: value.example?.trim() || undefined,
				},
				{
					onSuccess: () => {
						form.reset();
						setOpen(false);
					},
				},
			);
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) form.reset();
			}}
		>
			<DialogTrigger asChild>
				<Button>
					<Plus data-icon="inline-start" />
					Thêm từ
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Thêm từ vựng mới</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field
							name="hanzi"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid || undefined}>
										<FieldLabel htmlFor={field.name}>
											字 Chữ Hán <span className="text-destructive">*</span>
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Nhập chữ Hán..."
											autoComplete="off"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="pinyin"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid || undefined}>
										<FieldLabel htmlFor={field.name}>
											Pinyin <span className="text-destructive">*</span>
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Nhập pinyin..."
											autoComplete="off"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="meaning"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid || undefined}>
										<FieldLabel htmlFor={field.name}>
											Nghĩa <span className="text-destructive">*</span>
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Nhập nghĩa tiếng Việt..."
											autoComplete="off"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="radical"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid || undefined}>
										<FieldLabel htmlFor={field.name}>Bộ thủ cấu tạo</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Ví dụ: 氵, 木, 口..."
											autoComplete="off"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="etymology"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid || undefined}>
										<FieldLabel htmlFor={field.name}>
											Câu chuyện chiết tự
										</FieldLabel>
										<Textarea
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Ghi chú về cách nhớ mặt chữ..."
											rows={3}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="example"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid || undefined}>
										<FieldLabel htmlFor={field.name}>Ví dụ</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Câu ví dụ..."
											autoComplete="off"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>
					</FieldGroup>

					<div className="flex justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Huỷ
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending && <Loader2 className="animate-spin" />}
							Thêm vào kho
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
