import type {PetaReportData} from './peta';

const tendencies={
 D:'mengambil keputusan dan menggerakkan pekerjaan menuju hasil',
 I:'bertukar gagasan dan melibatkan orang lain melalui komunikasi',
 S:'menjaga dukungan, kesinambungan, dan kerja sama',
 C:'memperhatikan ketelitian, bukti, dan standar pekerjaan',
} as const;

/** Describe relative choices, never ability, diagnosis or a permanent personality type. */
export function petaNarrative(result:PetaReportData['result']):string{
 const highest=Math.max(...result.rows.map(row=>row.net));
 const top=result.rows.filter(row=>row.net===highest).map(row=>tendencies[row.dimension]);
 if(top.length===4)return 'Pilihan Anda menunjukkan kecenderungan yang relatif berimbang antara mendorong penyelesaian, melibatkan orang lain, menjaga kerja sama, dan memperhatikan ketelitian. Tidak ada satu kecenderungan yang paling menonjol berdasarkan selisih pilihan Anda. Cara Anda merespons dapat berbeda sesuai situasi; gunakan hasil ini sebagai bahan refleksi, bukan label diri yang tetap.';
 const list=top.length===1?top[0]:top.length===2?top.join(' dan '):top.slice(0,-1).join(', ')+', dan '+top.at(-1);
 const opening=top.length===1
  ?'Berdasarkan pilihan Anda, kecenderungan untuk '+list+' relatif paling menonjol.'
  :'Berdasarkan pilihan Anda, terlihat perpaduan kecenderungan untuk '+list+', dengan selisih pilihan tertinggi yang sama.';
 const ordered=result.rows.map(row=>row.net).sort((a,b)=>b-a);
 const context=top.length===1&&ordered[0]-ordered[1]<=2
  ?' Selisih dengan kecenderungan berikutnya tipis, sehingga seluruh pola perlu dibaca sebagai satu kesatuan.'
  :' Kecenderungan ini menggambarkan cara yang terasa lebih sesuai bagi Anda dalam situasi yang ditanyakan, bukan kemampuan yang lebih tinggi atau lebih rendah.';
 return opening+context+' Cocokkan gambaran ini dengan pengalaman sehari-hari dan gunakan sebagai bahan refleksi, bukan label pribadi yang tetap.';
}
