let TFTargetData = [];

// 页面加载时加载 TF-target 数据
window.onload = loadTFTargetData;
console.log("tf_target.js is loaded");
// 加载 TF-target 数据的函数
async function loadTFTargetData() {
    try {
        const response = await fetch('./ipredict_TF-Target.json'); // 替换为你的 TF-target 数据文件路径
        TFTargetData = await response.json();
        console.log("Loaded TF-target data:", TFTargetData);
        initializeTFTargetModule()
    } catch (error) {
        console.error("Error loading TF-target data:", error);
    }
}

// 初始化 TF-target 模块
function initializeTFTargetModule() {
    console.log("Initializing TF-target module...");

    // 示例筛选逻辑：根据条件筛选 TF-target 数据
    const cellCondition = document.getElementById("cell_condition").value;
    const artCondition = document.getElementById("ART_condition").value;
    const cancerCondition = document.getElementById("cancer_condition").value;

    const filteredTFTarget = TFTargetData.filter(item => {
        return (
            (cellCondition ? item.cell_condition.includes(cellCondition) : true) &&
            (artCondition ? item.ART_condition.includes(artCondition) : true) &&
            (cancerCondition ? item.cancer_condition.includes(cancerCondition) : true)
        );
    });

    console.log("Filtered TF-target data:", filteredTFTarget);

    // // 更新目标表格
    // updateTargetTable(filteredTFTarget);
}

// 更新目标表格的函数
function updateTargetTable(data) {
    const tableBody = document.querySelector("#target-table tbody");
    tableBody.innerHTML = ""; // 清空表格内容

    data.forEach(item => {
        const row = document.createElement("tr");

        // 添加 Target 列
        const targetCell = document.createElement("td");
        targetCell.textContent = item.Target_Gene[0];
        row.appendChild(targetCell);

        // 添加 gene family 列
        const familyCell = document.createElement("td");
        targetCell.textContent = item.gene_family[0];
        row.appendChild(familyCell);


        tableBody.appendChild(row);
    });
}
