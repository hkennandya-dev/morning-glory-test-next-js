import { z } from "zod";

export const schema = z.object({
  code: z.string({ required_error: "Kode wajib diisi", invalid_type_error: "Kode harus bernilai string" }).nonempty("Kode wajib diisi"),
  name: z.string({ required_error: "Nama wajib diisi", invalid_type_error: "Nama harus bernilai string" }).nonempty("Nama wajib diisi"),
  description: z.string().optional(),
});