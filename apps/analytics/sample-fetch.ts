fetch("https://www.linkedin.com/analytics/profile-views/", {
  headers: {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    priority: "u=0, i",
    "sec-ch-prefers-color-scheme": "dark",
    "sec-ch-ua": '"Chromium";v="143", "Not A(Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    cookie:
      'bcookie="v=2&cf4f935f-200f-485c-8bdb-c8a146649ccb"; bscookie="v=1&20250405032742363d7edc-75b5-4105-8d5c-5c77ec695a6cAQGo5FkeX-uaPicPQ-122H1UnAYUzC3d"; lang=v=2&lang=en-us; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; aam_uuid=81402227511895175514081250773780686201; li_sugr=80121030-631e-419b-b900-e425dba6a75a; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C20444%7CMCMID%7C80864399485990807404065814539383248562%7CMCAAMLH-1766935163%7C7%7CMCAAMB-1766935163%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1766337563s%7CNONE%7CvVersion%7C5.1.1; g_state={"i_l":0}; liap=true; JSESSIONID="ajax:7059392935371904808"; timezone=Asia/Saigon; li_theme=light; li_theme_set=app; dfpfpt=841d430647bd4916ae9fff05d7e77449; sdui_ver=sdui-flagship:0.1.23113.3+SduiFlagship0; li_at=AQEDASKLiMkABK0qAAABm0F--dAAAAGbidQ2ME4Ass29nGecwDjLvXTFJTQfQpIyDyqSnyv4Q-zfkMmhC2jXcQK__7s14vNsia4mjgorgsn8fzc8XkmxX88t4EQtXJ7-t52cKAIJ4ybN-Q0wqeJbO7tH; s_fid=7027378D8AD9D0C2-15F0C3DC7B653DAA; gpv_pn=www.linkedin.com%2Fcompany%2Fid-redacted%2Fadmin%2Fdashboard%2F; s_plt=7.46; s_pltp=www.linkedin.com%2Fcompany%2Fid-redacted%2Fadmin%2Fdashboard%2F; s_ips=816; s_tp=1659; s_ppv=www.linkedin.com%2Fcompany%2Fid-redacted%2Fadmin%2Fdashboard%2F%2C49%2C49%2C816%2C1%2C2; s_cc=true; s_tslv=1766939188748; s_sq=lnkdprod%3D%2526pid%253Dwww.linkedin.com%25252Fcompany%25252Fid-redacted%25252Fadmin%25252Fdashboard%25252F%2526pidt%253D1%2526oid%253D%252520%252520%252520%252520%252520%252520%252520%252520%25250A%252520%252520%252520%252520%25250A%252520%252520%252520%252520%25250A%25250A%25250A%25250A%25250A%252520%252520%252520%252520%25250A%2526oidt%253D3%2526ot%253DSUBMIT; UserMatchHistory=AQK4pfR4JPowhQAAAZtwRL3uoPamfQnT54fRrdHpXEP50Mw4TIWMHKrGGa2_sMtklxzuNFL7QRbovw; AnalyticsSyncHistory=AQJre-vJsk1kYgAAAZtwRL3uCGgSYlm53TBoKQnZbIT0ZL_aJKG-RU8aR1ZoiozrBKM7Ac1RDhxWKLy7AkjLZg; lms_ads=AQFsN9kz7KFFRAAAAZtwRL-LCu5LCbf30i_ymC_S_EdhMoKNPzT0sSKm71hI5GRTeZ4891oWHBLHZiKfnK1hM1gEes5tBlUU; lms_analytics=AQFsN9kz7KFFRAAAAZtwRL-LCu5LCbf30i_ymC_S_EdhMoKNPzT0sSKm71hI5GRTeZ4891oWHBLHZiKfnK1hM1gEes5tBlUU; _pxvid=d2a8c750-d9db-11f0-8927-0633f4430230; fptctx2=taBcrIH61PuCVH7eNCyH0APzNoEiOrOqF4FbdtfiWWIpmkPIApSaPky%252bjzq0wZ%252btd5Ycu7sPn%252bT6l7s7fsCsExb8KWoLhTMtzTmnpo5XZHXWUfJ%252b3nX9CWTjxH9mVVnjME846pgQdVgcAX60Kv2%252ftdU8s2ay8OxIA9gIAbHsJWEwRVpOxkqByQiD%252butOsqcvIuTBRfR0Rah9J9CW6OhNCzsniBQFBYeZSxwq68ZLSLweMNvjUgflKe%252ff5wKj1r47NplnuBTPMt%252baPNc9zh9cDHLrANK8npkhGPkF1ApntnWNesGXrOVX1V1FSyhiBRZc7KRjcx3A9s8XcElOAGWQwx2cggq3J9PmKqz0AAyqvcs%253d; __cf_bm=TkE4X.y0TipKfnJ41HvmbPfqjI1W2y_Rlx.mJsbhe4U-1767343067-1.0.1.1-ZXDoNqwrTfQXeVWKfkKxZ1YfD3z1fb1q6435iQB1qoEosse1ovRH0LSuONHvnrrSqKdd382Rn2rO.1LmkarpPjU7c.YcfYubmU0hE5pj7eM; lidc="b=VB65:s=V:r=V:a=V:p=V:g=62:u=1234:x=1:i=1767343111:t=1767427273:v=2:sig=AQHs2_HeIJwyCudcCiaimRhIlg0aX2t0"',
    Referer: "https://www.linkedin.com/dashboard/",
  },
  body: null,
  method: "GET",
});
