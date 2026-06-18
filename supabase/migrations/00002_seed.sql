-- Seed data: 20 Chinese vocabulary words for learning

-- Helper: insert word + its review record
DO $$
DECLARE
  wid UUID;
  today DATE := CURRENT_DATE;
BEGIN

-- 1. 你好 (nǐ hǎo) - Xin chào
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('你好', 'nǐ hǎo', 'Xin chào', '亻, 女',
  '你 = 亻(người) + 尔(mày). 好 = 女(phụ nữ) + 子(trẻ con) → phụ nữ có con là "tốt"',
  '你好，我叫小明。', ARRAY['cơ bản', 'chào hỏi']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 2. 谢谢 (xiè xiè) - Cảm ơn
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('谢谢', 'xiè xiè', 'Cảm ơn', '讠',
  '谢 = 讠(nói) + 身(thân) + 寸(tấc) → dùng lời nói từ thân tâm để cảm ơn',
  '谢谢你的帮助。', ARRAY['cơ bản', 'chào hỏi']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 3. 学习 (xué xí) - Học tập
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('学习', 'xué xí', 'Học tập', '子, 习',
  '学 = ㊣ + 子(trẻ em) → trẻ em học dưới mái nhà. 习 = 羽(lông vũ) → chim tập bay',
  '我在学习中文。', ARRAY['cơ bản', 'học tập']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 4. 中文 (zhōng wén) - Tiếng Trung
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('中文', 'zhōng wén', 'Tiếng Trung', '丨, 文',
  '中 = 口(khung) + 丨(trục) → ở giữa. 文 = hình vẽ trang trí → văn tự',
  '中文很好学。', ARRAY['cơ bản', 'ngôn ngữ']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 5. 老师 (lǎo shī) - Thầy giáo / Cô giáo
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('老师', 'lǎo shī', 'Giáo viên, thầy cô', '耂, 巾',
  '老 = 耂(người già) + 匕 → người cao tuổi. 师 = 巾(khăn) + 帀 → người dạy học',
  '老师好！', ARRAY['cơ bản', 'trường học']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 6. 学生 (xué shēng) - Học sinh
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('学生', 'xué shēng', 'Học sinh', '子, 生',
  '学 = học. 生 = 牛(bò) + 一(mặt đất) → cây mọc lên từ đất → sinh ra, sự sống',
  '我是学生。', ARRAY['cơ bản', 'trường học']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 7. 朋友 (péng yǒu) - Bạn bè
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('朋友', 'péng yǒu', 'Bạn bè', '月, 又',
  '朋 = 月(thịt) + 月 → hai mảnh thịt dính nhau → bạn bè thân thiết. 友 = 𠂇 + 又(tay) → bắt tay nhau',
  '他是我的朋友。', ARRAY['cơ bản', 'xã hội']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 8. 妈妈 (mā ma) - Mẹ
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('妈妈', 'mā ma', 'Mẹ', '女',
  '妈 = 女(phụ nữ) + 马(ngựa) → mẹ vất vả như ngựa, chữ mô phỏng âm "ma"',
  '妈妈做饭很好吃。', ARRAY['cơ bản', 'gia đình']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 9. 吃饭 (chī fàn) - Ăn cơm
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('吃饭', 'chī fàn', 'Ăn cơm', '口, 饣',
  '吃 = 口(miệng) + 乞 → dùng miệng ăn. 饭 = 饣(lương thực) + 反(trở lại) → cơm là thứ ăn hàng ngày',
  '你吃饭了吗？', ARRAY['cơ bản', 'ăn uống']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 10. 看书 (kàn shū) - Đọc sách / Xem sách
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('看书', 'kàn shū', 'Đọc sách, xem sách', '目, 乛',
  '看 = 手(tay) + 目(mắt) → đưa tay lên mắt để nhìn. 书 = 乛 + 丨 + 丶 → nét chữ (tượng hình)',
  '我喜欢看书。', ARRAY['cơ bản', 'học tập']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 11. 说话 (shuō huà) - Nói chuyện
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('说话', 'shuō huà', 'Nói chuyện', '讠, 舌',
  '说 = 讠(nói) + 兑(trao đổi) → trao đổi lời nói. 话 = 讠(nói) + 舌(lưỡi) → lời nói từ lưỡi',
  '请说话小声一点。', ARRAY['cơ bản', 'giao tiếp']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 12. 天气 (tiān qì) - Thời tiết
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('天气', 'tiān qì', 'Thời tiết', '一, 气',
  '天 = 一(một) + 大(lớn) → trên trời cao rộng. 气 = hơi bay lên (tượng hình) → khí',
  '今天天气很好。', ARRAY['cơ bản', 'thời tiết']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 13. 今天 (jīn tiān) - Hôm nay
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('今天', 'jīn tiān', 'Hôm nay', '人, 一',
  '今 = 人(người) + 乛 + 丶 → hôm nay có người đến. 天 = trời → ngày hôm nay',
  '今天几月几号？', ARRAY['cơ bản', 'thời gian']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 14. 明天 (míng tiān) - Ngày mai
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('明天', 'míng tiān', 'Ngày mai', '日, 一',
  '明 = 日(mặt trời) + 月(mặt trăng) → sáng, rõ → ngày mai trời lại sáng',
  '明天见！', ARRAY['cơ bản', 'thời gian']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 15. 昨天 (zuó tiān) - Hôm qua
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('昨天', 'zuó tiān', 'Hôm qua', '日, 一',
  '昨 = 日(mặt trời) + 乍(bỗng nhiên) → ngày đã qua',
  '昨天我去学校了。', ARRAY['cơ bản', 'thời gian']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 16. 时间 (shí jiān) - Thời gian
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('时间', 'shí jiān', 'Thời gian', '日, 门',
  '时 = 日(mặt trời) + 寸(đo đạc) → đo bóng mặt trời → thời gian. 间 = 门(cổng) + 日(mặt trời) → ánh sáng qua khe cửa → khoảng',
  '时间过得真快。', ARRAY['cơ bản', 'thời gian']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 17. 学校 (xué xiào) - Trường học
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('学校', 'xué xiào', 'Trường học', '子, 木',
  '学 = học. 校 = 木(gỗ) + 交(giao) → nơi có bảng gỗ để học → trường học',
  '学校很大。', ARRAY['cơ bản', 'trường học']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 18. 电脑 (diàn nǎo) - Máy tính
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('电脑', 'diàn nǎo', 'Máy tính', '田, 月',
  '电 = 田(ruộng) + 乚 → chớp điện trên ruộng → điện. 脑 = 月(thịt) + 巛 + 凶 → bộ não → đầu óc',
  '我用电脑学习。', ARRAY['hiện đại', 'công nghệ']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 19. 手机 (shǒu jī) - Điện thoại di động
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('手机', 'shǒu jī', 'Điện thoại di động', '手, 木',
  '手 = tay. 机 = 木(gỗ) + 几(kỷ) → máy móc bằng gỗ → máy',
  '我的手机没电了。', ARRAY['hiện đại', 'công nghệ']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

-- 20. 汉字 (hàn zì) - Chữ Hán
INSERT INTO words (hanzi, pinyin, meaning, radical, etymology, example, tags)
VALUES ('汉字', 'hàn zì', 'Chữ Hán', '氵, 宀',
  '汉 = 氵(nước) + 又(tay) → sông Hán (tên dân tộc Hán). 字 = 宀(mái nhà) + 子(trẻ con) → chữ viết được sinh ra trong nhà',
  '汉字很有意思。', ARRAY['cơ bản', 'ngôn ngữ']) RETURNING id INTO wid;
INSERT INTO word_reviews (word_id, interval_level, next_review_at, total_reviews) VALUES (wid, 0, today, 0);

END $$;
