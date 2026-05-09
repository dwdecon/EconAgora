/* eslint-disable @typescript-eslint/no-require-imports */
const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: 'ai4econ-3gt6e9nh6a4e2f85'
});

const db = app.database();

// 飞书数据字段映射
// 索引: 0=提示词内容, 1=AI+科研 Prompt 收集, 2=主题(标题), 3=一句话简要描述, 4=作者, 5=日期, 6=标签
const feishuData = [
  // 这里会填充从飞书获取的数据
];

async function importPrompts() {
  let successCount = 0;
  let errorCount = 0;

  for (const row of feishuData) {
    // 跳过空行
    if (!row[2] || row.every(cell => cell === null)) {
      continue;
    }

    try {
      const promptData = {
        title: row[2] || '',
        content: row[0] || '',
        description: row[3] || '',
        category: row[6] && row[6].length > 0 ? row[6][0] : '其他',
        tags: row[6] || [],
        author_id: 'feishu_import',
        author_name: row[4] || '未知',
        source_date: row[5] || new Date().toISOString().split('T')[0],
        is_featured: false,
        view_count: 0,
        like_count: 0,
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      };

      await db.collection('prompt').add(promptData);
      successCount++;
      console.log(`✓ 导入成功: ${promptData.title}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ 导入失败: ${row[2]}`, error.message);
    }
  }

  console.log(`\n导入完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);
}

importPrompts().catch(console.error);
