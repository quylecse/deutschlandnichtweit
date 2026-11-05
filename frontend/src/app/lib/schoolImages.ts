/**
 * Bộ sưu tập ảnh phong cảnh học thuật, giảng đường đại học và các thành phố tiêu biểu của Đức.
 * Tuyển chọn theo phong cách kiến trúc cổ điển & hiện đại, tối giản, thanh lịch.
 */
export const CITY_IMAGES: Record<string, string> = {
  Berlin:
    'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80',
  München:
    'https://studienkolleg-münchen.de/wp-content/uploads/2017/02/infanterie_260816_018p-1-1024x851.jpg',
  'Frankfurt am Main':
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhI38dCTWtt70cZF8Qi44XbYJJg4L1XyYiGirE7zA-gt_f_soCSBofAFE&s=10',
  Hamburg:
    'https://www.deincampusplan.de/wp-content/uploads/2026/08/studienkolleg-scaled.webp',
  Heidelberg:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTjaOftQd9j5A07_J-HFRvN9GCdaM1U4FfTvmUjGZSX1AFmnDlRriTLqA&s=10',
  Karlsruhe:
    'https://www.stk.kit.edu/img/content/stknew_Karlsruher-Schloss_600x340px.png',
  Leipzig:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3Cl6I0ImwFKA_UPophUuotTj9zF4xoZQpeuHiXvRN23CZDGfT43jrYsQF&s=10',
  Hannover:
    'https://www.stk.uni-hannover.de/typo3temp/lf_vhs_direct/fpdirect_7f09aa26eece0895ec234f9d0b1a5c69d055a8e3.webp',
  Darmstadt:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRF4UZcNluIkCXtqYrVqjicDov8q-2XBH1aI32Xtchn44zySPy2ogh_0FBv&s=10',
  Kassel:
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  Marburg:
    'https://stuwoli.de/wp-content/uploads/2020/03/Marburg-Studienkolleg-1.jpeg',
  Mainz:
    'https://cms.zdv.uni-mainz.de/fb03-orga/wp-content/uploads/sites/1105/2026/04/Uni-Eingang.jpg',
  Kiel:
    'https://dlc-live-hub.s3.eu-central-3.ionoscloud.com/content/LearningVenue/68a44a9c6d544.jpg',
  Konstanz:
    'https://www.htwg-konstanz.de/fileadmin/pub/allgemein/Bilder/Bilder_Quadrate_490x490px/Bilder_490x490px_Campus-u-Image/Hochschule-Konstanz-HTWG-Campus-Seerhein-492x492px.jpg',
  'Halle (Saale)':
    'https://d26uhjq9x2kecg.cloudfront.net/university/university-of-halle-wittenberg-martin-luther-university-uni4edu_id_1748461321396.webp?cb=1748461322393',
  Nordhausen:
    'https://studienkollegs-in.de/wp-content/uploads/2017/05/Studienkolleg-Nordhausen.jpg',
  Köthen:
    'https://www.hs-anhalt.de/fileadmin/_processed_/6/6/csm_Hauptgebaeude_HS_Anhalt_2_12b5543d73.jpg',
  Coburg:
    'https://studienkolleg-coburg.de/wp-content/uploads/2026/01/20260121_0824561-1024x576.jpg',
  Wismar:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT79qncnnqFEnoou_8E_0zZBVIkLKZ2pjTKpNEOp5NfsMOpwvhHZFpIpS8&s=10',
  Zittau:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSR1JKr6MFrsrMIgvA08u1yxJEfnYqFzHyXDMikoFvRx7_gbKjYYq70HJW_&s=10',
  Kaiserslautern:
    'https://images.unsplash.com/photo-1668970788836-3f9faca33724?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
};

const DEFAULT_CAMPUS_IMAGE =
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80';

export function getCityImage(city?: string): string {
  if (!city) return DEFAULT_CAMPUS_IMAGE;
  return CITY_IMAGES[city] || DEFAULT_CAMPUS_IMAGE;
}

