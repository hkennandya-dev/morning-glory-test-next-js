import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { toast } from "sonner"
// import { supabase } from "@/lib/supabase"
import Lightbox from "yet-another-react-lightbox";
import { fetch } from "@/lib/axios"

export function InputImage({
  className,
  onChange,
  disabled,
  isLightbox = false,
  readOnly,
  placeholder,
  value,
  defaultValue,
  clearable = true,
}: {
  className?: string
  onChange?: (url: string | null) => void
  disabled?: boolean
  readOnly?: boolean
  isLightbox?: boolean
  placeholder?: string
  value?: string | null
  defaultValue?: string
  clearable?: boolean
}) {
  const [preview, setPreview] = React.useState<string | null>(defaultValue || null)
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const api = fetch();

  React.useEffect(() => {
    if (value !== undefined) {
      setPreview(value)
    }
  }, [value])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return

    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast.warning("Format gambar tidak didukung. Harap gunakan JPG, PNG, GIF, SVG, atau WEBP.")
      handleClear()
      return
    }

    if (file.size > 1 * 1024 * 1024) {
      toast.warning("Ukuran berkas maksimum adalah 1MB.")
      handleClear()
      return
    }

    setLoading(true)

    try {
      toast.loading("Mengunggah gambar")
      const formData = new FormData()
      formData.append("file", file) 

      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const publicUrl = res.data?.url || res.data?.data?.url

      setPreview(publicUrl)
      if (onChange) onChange(publicUrl)

      toast.dismiss();
      toast.success("Gambar berhasil diunggah")
    } catch (error: unknown) {
      console.error("Kesalahan unggah", error)
      toast.dismiss();
      toast.error("Gagal mengunggah gambar")
      handleClear()
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setPreview(null)
    if (onChange) onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="group/input-image relative flex items-center w-full">
        <Input
          ref={fileInputRef}
          type="file"
          className="hover:cursor-pointer placeholder:file:hidden hover:bg-accent file:pr-3 sm:file:border-r sm:file:border-input file:mr-3 file:cursor-pointer"
          accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
          onChange={handleFileChange}
          disabled={disabled || readOnly || loading}
          placeholder={placeholder}
        />
        {clearable && preview && !disabled && !readOnly && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleClear}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-transparent dark:hover:bg-transparent opacity-50 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {preview && (
        <div className="mt-2">
          {/* eslint-disable @next/next/no-img-element */}
          <img
            onClick={() => isLightbox && setOpen(true)}
            src={preview}
            alt="Preview"
            className={cn("max-w-full max-h-80 object-cover rounded-lg border", isLightbox && "cursor-pointer")}
          />
          <Lightbox
            open={open}
            close={() => setOpen(false)}
            slides={[{ src: preview }]}
            render={{
              iconNext: () => null,
              iconPrev: () => null,
              buttonNext: () => null,
              buttonPrev: () => null,
              iconClose: () => <X className="w-6 h-6 text-inherit" />,
            }}
            styles={{
              button: { filter: "none" }
            }}
            controller={{ closeOnBackdropClick: true, disableSwipeNavigation: true }}
          />
        </div>
      )}
    </div>
  )
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "read-only:opacity-75 read-only:cursor-default read-only:focus-visible:ring-0 read-only:focus-visible:border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 transition-[color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs sm:file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-xs sm:text-sm",
          "focus-visible:ring-ring/50 focus-visible:ring-[2px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
