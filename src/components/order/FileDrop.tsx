import { useRef, useState, type DragEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleCheck, CloudUpload, FileText, ImageIcon, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBytes } from './draft'

/**
 * Drag-and-drop / click-to-browse upload for the signed requisition form.
 * The parent validates the file and keeps only its name.
 */
export function FileDrop({
  id,
  fileName,
  fileSize,
  invalid,
  onFile,
  onClear,
}: {
  id: string
  fileName: string
  fileSize: number
  invalid?: boolean
  onFile: (file: File) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const isPdf = /\.pdf$/i.test(fileName)

  const pick = (files: FileList | null) => {
    const f = files?.[0]
    if (f) onFile(f)
    // Allow re-selecting the same file after clearing.
    if (inputRef.current) inputRef.current.value = ''
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files)
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="peer sr-only"
        aria-invalid={invalid || undefined}
        onChange={(e) => pick(e.target.files)}
      />
      <AnimatePresence mode="wait" initial={false}>
        {fileName ? (
          <motion.div
            key="chip"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 pr-2 peer-focus-visible:ring-4 peer-focus-visible:ring-blood-100 sm:p-4"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-blood-600 shadow-soft">
              {isPdf ? <FileText className="size-5" /> : <ImageIcon className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-950" title={fileName}>
                {fileName}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-700">
                <CircleCheck className="size-3.5" aria-hidden />
                Attached{fileSize ? ` · ${formatBytes(fileSize)}` : ''}
              </p>
            </div>
            <label
              htmlFor={id}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-700 hover:bg-white"
            >
              <RefreshCw className="size-4" aria-hidden />
              <span className="hidden sm:inline">Replace</span>
              <span className="sr-only sm:hidden">Replace file</span>
            </label>
            <button
              type="button"
              onClick={onClear}
              className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-white hover:text-ink-900"
              aria-label={`Remove ${fileName}`}
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ) : (
          <motion.label
            key="zone"
            htmlFor={id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-9 text-center transition-colors',
              'peer-focus-visible:border-blood-500 peer-focus-visible:ring-4 peer-focus-visible:ring-blood-100',
              dragging
                ? 'border-blood-500 bg-blood-50'
                : invalid
                  ? 'border-blood-300 bg-blood-50/40 hover:bg-blood-50'
                  : 'border-ink-200 bg-ink-50/50 hover:border-ink-300 hover:bg-ink-50',
            )}
          >
            <motion.span
              animate={dragging ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }}
              className={cn(
                'grid size-14 place-items-center rounded-2xl shadow-soft transition-colors',
                dragging ? 'bg-blood-600 text-white' : 'bg-white text-blood-600 group-hover:text-blood-700',
              )}
            >
              <CloudUpload className="size-6" aria-hidden />
            </motion.span>
            <span>
              <span className="block text-sm font-semibold text-ink-950">
                {dragging ? 'Drop to attach' : 'Drag the scan here, or '}
                {!dragging && <span className="text-blood-700 underline decoration-blood-200 underline-offset-4">browse files</span>}
              </span>
              <span className="mt-1 block text-xs text-ink-500">PDF, JPG or PNG · up to 5 MB · photo from your phone works</span>
            </span>
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  )
}
