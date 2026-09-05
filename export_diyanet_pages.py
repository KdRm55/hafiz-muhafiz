import fitz
import os
import time
from PIL import Image

def export_all_pages():
    start = time.time()
    pdf_path = 'diyanet_mushaf.pdf'
    if not os.path.exists(pdf_path):
        print("Error: diyanet_mushaf.pdf not found!")
        return

    doc = fitz.open(pdf_path)
    total_pdf_pages = len(doc)
    print(f"Loaded PDF with {total_pdf_pages} pages.")

    out_dirs = ['diyanet_pages', 'public/diyanet_pages', 'www/diyanet_pages']
    for d in out_dirs:
        os.makedirs(d, exist_ok=True)

    # Mushaf pages 1 to 604
    # Formül: Mushaf sayfa p -> doc[p] (PDF sayfa p + 1)
    for p in range(1, 605):
        if p >= total_pdf_pages:
            break
        
        # 140 DPI gives sharp, crystal-clear 1050x1520 calligraphy
        pix = doc[p].get_pixmap(dpi=140)
        temp_jpg = f"diyanet_pages/{p}_temp.jpg"
        pix.save(temp_jpg)

        img = Image.open(temp_jpg)
        # Convert and save as WebP with optimal compression
        webp_dest_root = f"diyanet_pages/{p}.webp"
        img.save(webp_dest_root, 'WEBP', quality=80, method=4)

        # Copy to public and www
        with open(webp_dest_root, 'rb') as f:
            data = f.read()
            for d in ['public/diyanet_pages', 'www/diyanet_pages']:
                with open(f"{d}/{p}.webp", 'wb') as out_f:
                    out_f.write(data)

        if os.path.exists(temp_jpg):
            os.remove(temp_jpg)

        if p % 50 == 0 or p == 604:
            elapsed = time.time() - start
            print(f"Progress: {p}/604 pages exported ({round(elapsed, 1)}s elapsed)")

    print(f"All 604 pages successfully exported in {round(time.time() - start, 1)}s!")

if __name__ == '__main__':
    export_all_pages()
