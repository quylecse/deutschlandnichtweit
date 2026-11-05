/**
 * Bộ sưu tập ảnh phong cảnh học thuật, giảng đường đại học và các thành phố tiêu biểu của Đức.
 * Tuyển chọn theo phong cách kiến trúc cổ điển & hiện đại, tối giản, thanh lịch.
 */
export const CITY_IMAGES: Record<string, string> = {
  Berlin:
    'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80',
  München:
    'https://images.unsplash.com/photo-1595867818082-083862f3d630?auto=format&fit=crop&w=800&q=80',
  'Frankfurt am Main':
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
  Hamburg:
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80',
  Heidelberg:
    'https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?auto=format&fit=crop&w=800&q=80',
  Karlsruhe:
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  Leipzig:
    'https://images.unsplash.com/photo-1507842229356-51c61504d3ab?auto=format&fit=crop&w=800&q=80',
  Hannover:
    'https://images.unsplash.com/photo-1584448141569-69f342da535c?auto=format&fit=crop&w=800&q=80',
  Darmstadt:
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80',
  Kassel:
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  Marburg:
    'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=800&q=80',
  Mainz:
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
  Kiel:
    'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=800&q=80',
  Konstanz:
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
  'Halle (Saale)':
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
  Nordhausen:
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
  Köthen:
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
  Coburg:
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
  Wismar:
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
  Zittau:
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  Kaiserslautern:
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_CAMPUS_IMAGE =
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80';

export function getCityImage(city?: string): string {
  if (!city) return DEFAULT_CAMPUS_IMAGE;
  return CITY_IMAGES[city] || DEFAULT_CAMPUS_IMAGE;
}
