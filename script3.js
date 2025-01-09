let miRTargetData = [];
let TFMiRNAData = [];
let globalMiRTargetData = []; // 全局变量，用于存储筛选后的 miRNA-target 数据
let globalTFMiRNAData = []; // 全局变量，用于存储筛选后的 TF-miRNA 数据
//模块切换部分
let activeNADCButton = 'iPredict';
// 获取所有按钮
const nadcButtons = document.querySelectorAll('.nadc-button');
// 设置默认激活按钮
document.addEventListener('DOMContentLoaded', () => {
    // 默认激活 iPredict，并运行对应的逻辑
    const defaultButton = document.getElementById('btn-ipredict');
    defaultButton.classList.add('active');
    handleNADCButtonClick('ipredict'); // 运行默认逻辑
});
// 添加按钮点击事件监听器
nadcButtons.forEach(button => {
    button.addEventListener('click', () => {
        const buttonId = button.id.replace('btn-', ''); // 获取按钮对应的功能名
        // 更新激活状态
        nadcButtons.forEach(btn => btn.classList.remove('active')); // 清除其他按钮的激活状态
        button.classList.add('active'); // 激活当前按钮
        // 更新全局变量并运行对应逻辑
        activeNADCButton = buttonId;
        handleNADCButtonClick(buttonId);
    });
});
function handleNADCButtonClick(buttonName) {
    console.log(`Button ${buttonName} clicked.`);
    resetModuleEnvironment()
    // 切换模块后强制展开target-panel
    targetPanel.style.display = 'flex'; // 显示 target-panel
    targetPanel.classList.add('open');
    // networkContainer.style.display='none'; // 隐藏绘图区域
    toggleButton.innerHTML = '&lt;'; // 改为左箭头
    //
    if (buttonName === 'ipredict') {
        console.log('Running iPredict logic...');
        runiPredictLogic();
    } else if (buttonName === 'dnadc') {
        console.log('Running dNADC logic...');
        runDNADCLogic(); // 运行 dNADC 的逻辑
    } else if (buttonName === 'rnadc') {
        console.log('Running rNADC logic...');
        runRNADCLogic(); // 运行 rNADC 的逻辑
    } else {
        console.error('Unknown button clicked:', buttonName);
    }
}

// 清理机制
// 清理所有与模块相关的状态
function resetModuleEnvironment() {
    console.log('Resetting module environment...');
    // 清理全局变量
    miRTargetData = [];
    TFMiRNAData = [];
    globalMiRTargetData = [];
    globalTFMiRNAData = [];
    // 清除缓存或临时状态
    sessionStorage.clear(); // 清除 sessionStorage 数据
    localStorage.clear(); // 清除 localStorage 数据（如果有必要）
    console.log('Module environment reset complete.');
}

    // ipredict部分的逻辑
async function  runiPredictLogic(){
    await loadData(); // 默认加载ipredict数据
    // ipredict初始参数
    ART_condition = "ART"; // 默认值
    document.getElementById("ART_yes").checked=true;
    document.getElementById("ART_no").checked=false;
    filterSubcellularLocations();
    document.getElementById("cell_condition").addEventListener("change", () => {
        document.getElementById("ART_yes").checked=false;
        document.getElementById("ART_no").checked=false;
    });
    // 为YES和NO按钮添加事件监听
    document.getElementById("ART_yes").addEventListener("click", (event) => {
        if (event.target.checked) {
            setARTCondition("ART"); // YES 被选中时调用逻辑
        }
    });
    document.getElementById("ART_no").addEventListener("click", (event) => {
        if (event.target.checked) {
            setARTCondition("nonART"); // NO 被选中时调用逻辑
        }
    });
    function setARTCondition(condition) {
        ART_condition = condition;
        // 更新按钮的状态
        document.getElementById("ART_yes").checked=(condition === "ART");
        document.getElementById("ART_no").checked=(condition === "nonART");
        console.log('ART_condition:',condition);
        // 更新Cancer Condition下拉菜单
        updateCancerConditionOptions();
        filterSubcellularLocations();
    }
    //ipredict限制可能出现的ART组合
    const validCombinations = [
        "CD4_BLCA_ART", "CD4_BRCA_ART", "CD4_COAD_ART", "CD4_ESCA_ART",
        "CD4_HNSC_ART", "CD4_KICH_ART", "CD4_KIRC_ART", "CD4_KIRP_ART",
        "CD4_LIHC_ART", "CD4_LUAD_ART", "CD4_LUSC_ART", "CD4_PRAD_ART",
        "CD4_READ_ART", "CD4_STAD_ART", "CD4_THCA_ART", "CD4_UCEC_ART",
        "CD8A_BLCA_ART", "CD8A_BRCA_ART", "CD8A_COAD_ART", "CD8A_ESCA_ART",
        "CD8A_HNSC_ART", "CD8A_KICH_ART", "CD8A_KIRC_ART", "CD8A_KIRP_ART",
        "CD8A_LIHC_ART", "CD8A_LUAD_ART", "CD8A_LUSC_ART", "CD8A_PRAD_ART",
        "CD8A_READ_ART", "CD8A_STAD_ART", "CD8A_THCA_ART", "CD8A_UCEC_ART",
        "CD4CD8A_BLCA_ART", "CD4CD8A_BRCA_ART", "CD4CD8A_HNSC_ART",
        "CD4CD8A_KIRC_ART", "CD4CD8A_KIRP_ART", "CD4CD8A_LIHC_ART",
        "CD4CD8A_LUAD_ART", "CD4CD8A_LUSC_ART", "CD4_BLCA_nonART",
        "CD4_BRCA_nonART", "CD4_COAD_nonART", "CD4_ESCA_nonART",
        "CD4_HNSC_nonART", "CD4_KICH_nonART", "CD4_KIRC_nonART",
        "CD4_KIRP_nonART", "CD4_LIHC_nonART", "CD4_LUAD_nonART",
        "CD4_LUSC_nonART", "CD4_PRAD_nonART", "CD4_READ_nonART",
        "CD4_STAD_nonART", "CD4_THCA_nonART", "CD4_UCEC_nonART",
        "CD8A_BLCA_nonART", "CD8A_BRCA_nonART", "CD8A_COAD_nonART",
        "CD8A_ESCA_nonART", "CD8A_HNSC_nonART", "CD8A_KICH_nonART",
        "CD8A_KIRC_nonART", "CD8A_KIRP_nonART", "CD8A_LIHC_nonART",
        "CD8A_LUAD_nonART", "CD8A_LUSC_nonART", "CD8A_PRAD_nonART",
        "CD8A_READ_nonART", "CD8A_STAD_nonART", "CD8A_THCA_nonART",
        "CD8A_UCEC_nonART", "CD4CD8A_BLCA_nonART", "CD4CD8A_BRCA_nonART",
        "CD4CD8A_HNSC_nonART", "CD4CD8A_KIRC_nonART", "CD4CD8A_KIRP_nonART",
        "CD4CD8A_LIHC_nonART", "CD4CD8A_LUAD_nonART", "CD4CD8A_LUSC_nonART"
    ];
    // ipredict部分 更新Cancer Condition下拉菜单
    function updateCancerConditionOptions() {
        const cellCondition = document.getElementById("cell_condition").value;
        const cancerConditionSelect = document.getElementById("cancer_condition");
        // 筛选出当前有效的组合
        const validCancerConditions = validCombinations
            .filter(combination => combination.startsWith(`${cellCondition}_`) && combination.endsWith(`_${ART_condition}`))
            .map(combination => combination.split("_")[1]); // 提取Cancer Condition
        // 清空并填充新的选项
        cancerConditionSelect.innerHTML = "";
        validCancerConditions.forEach(condition => {
            const option = document.createElement("option");
            option.value = condition;
            option.textContent = condition;
            cancerConditionSelect.appendChild(option);
        });
    }
    // ipredict部分 监听cancer_condition 下拉框的选择，用户选择后运行筛选函数
    document.getElementById("cancer_condition").addEventListener("change", () => {
        const cancerCondition = document.getElementById("cancer_condition").value;
        if (cancerCondition) {
            // 只有用户选择了有效的 cancer_condition 时运行筛选函数
            filterSubcellularLocations();
        }
    });
    // 监听切换按钮的变化情况，重新导入不同模块的数据
    // 监听co-regulation部分的变化情况，重新运行filterSubcellularLocations函数
    const modeSelect = document.getElementById("mode");
    // 监听下拉菜单的 change 事件
    modeSelect.addEventListener("change", () => {
        console.log("Mode changed to:", modeSelect.value); // 调试日志
        filterSubcellularLocations();
    });
}

async function runDNADCLogic(){
    await loadData1(); // 默认加载dNADC数据
    // dNADC初始参数
    ART_condition_dNADC="ART";
    document.getElementById("ART_yes_dnadc").checked=true;
    document.getElementById("ART_no_dnadc").checked=false;
    filterSubcellularLocations1();

    // 为YES和NO按钮添加事件监听
    document.getElementById("ART_yes_dnadc").addEventListener("change", (event) => {
        if (event.target.checked) {
            setARTCondition("ART");
        }
    });
    document.getElementById("ART_no_dnadc").addEventListener("click", (event) => {
        if (event.target.checked) {
            setARTCondition("nonART");
        }
    });
    function setARTCondition(condition) {
        ART_condition_dNADC= condition;
        // 更新按钮的状态
        document.getElementById("ART_yes_dnadc").checked=(condition === "ART");
        document.getElementById("ART_no_dnadc").checked=(condition === "nonART");
        // 更新Cancer Condition下拉菜单
        filterSubcellularLocations1();
    }
    // dNADC部分 监听cancer_condition 下拉框的选择，用户选择后运行筛选函数
    document.getElementById("dnadc_cancer_condition").addEventListener("change", () => {
        const cancerCondition = document.getElementById("dnadc_cancer_condition").value;
        if (cancerCondition) {
            // 只有用户选择了有效的 cancer_condition 时运行筛选函数
            filterSubcellularLocations1();
        }
    });
    // 监听切换按钮的变化情况，重新导入不同模块的数据
    // 监听co-regulation部分的变化情况，重新运行filterSubcellularLocations函数
    const modeSelect = document.getElementById("mode");
    // 监听下拉菜单的 change 事件
    modeSelect.addEventListener("change", () => {
        console.log("Mode changed to:", modeSelect.value); // 调试日志
        filterSubcellularLocations1();
    });
}

async function runRNADCLogic(){
    await loadData2(); // 默认加载dNADC数据
    // rNADC初始参数
    filterSubcellularLocations2();

    // rNADC部分 监听cancer_condition 下拉框的选择，用户选择后运行筛选函数
    document.getElementById("rnadc_cancer_condition").addEventListener("change", () => {
        const cancerCondition = document.getElementById("rnadc_cancer_condition").value;
        if (cancerCondition) {
            // 只有用户选择了有效的 cancer_condition 时运行筛选函数
            filterSubcellularLocations2();
        }
    });
    // 监听切换按钮的变化情况，重新导入不同模块的数据
    // 监听co-regulation部分的变化情况，重新运行filterSubcellularLocations函数
    const modeSelect = document.getElementById("mode");
    // 监听下拉菜单的 change 事件
    modeSelect.addEventListener("change", () => {
        console.log("Mode changed to:", modeSelect.value); // 调试日志
        filterSubcellularLocations2();
    });
}

// if (activeNADCButton==='iPredict'){
    // 每次重新选择cell_condition就重置ART状态，防止用户乱选
//     document.getElementById("cell_condition").addEventListener("change", () => {
//         document.getElementById("ART_yes").classList.remove("active");
//         document.getElementById("ART_no").classList.remove("active");
//     });
// // 为YES和NO按钮添加事件监听
//     document.getElementById("ART_yes").addEventListener("click", () => {
//         setARTCondition("ART");
//     });
//     document.getElementById("ART_no").addEventListener("click", () => {
//         setARTCondition("nonART");
//
//     });
//     function setARTCondition(condition) {
//         ART_condition = condition;
//         // 更新按钮的状态
//         document.getElementById("ART_yes").classList.toggle("active", condition === "ART");
//         document.getElementById("ART_no").classList.toggle("active", condition === "nonART");
//         console.log('ART_condition:',condition);
//         // 更新Cancer Condition下拉菜单
//         updateCancerConditionOptions();
//     }
// //ipredict限制可能出现的ART组合
//     const validCombinations = [
//         "CD4_BLCA_ART", "CD4_BRCA_ART", "CD4_COAD_ART", "CD4_ESCA_ART",
//         "CD4_HNSC_ART", "CD4_KICH_ART", "CD4_KIRC_ART", "CD4_KIRP_ART",
//         "CD4_LIHC_ART", "CD4_LUAD_ART", "CD4_LUSC_ART", "CD4_PRAD_ART",
//         "CD4_READ_ART", "CD4_STAD_ART", "CD4_THCA_ART", "CD4_UCEC_ART",
//         "CD8A_BLCA_ART", "CD8A_BRCA_ART", "CD8A_COAD_ART", "CD8A_ESCA_ART",
//         "CD8A_HNSC_ART", "CD8A_KICH_ART", "CD8A_KIRC_ART", "CD8A_KIRP_ART",
//         "CD8A_LIHC_ART", "CD8A_LUAD_ART", "CD8A_LUSC_ART", "CD8A_PRAD_ART",
//         "CD8A_READ_ART", "CD8A_STAD_ART", "CD8A_THCA_ART", "CD8A_UCEC_ART",
//         "CD4CD8A_BLCA_ART", "CD4CD8A_BRCA_ART", "CD4CD8A_HNSC_ART",
//         "CD4CD8A_KIRC_ART", "CD4CD8A_KIRP_ART", "CD4CD8A_LIHC_ART",
//         "CD4CD8A_LUAD_ART", "CD4CD8A_LUSC_ART", "CD4_BLCA_nonART",
//         "CD4_BRCA_nonART", "CD4_COAD_nonART", "CD4_ESCA_nonART",
//         "CD4_HNSC_nonART", "CD4_KICH_nonART", "CD4_KIRC_nonART",
//         "CD4_KIRP_nonART", "CD4_LIHC_nonART", "CD4_LUAD_nonART",
//         "CD4_LUSC_nonART", "CD4_PRAD_nonART", "CD4_READ_nonART",
//         "CD4_STAD_nonART", "CD4_THCA_nonART", "CD4_UCEC_nonART",
//         "CD8A_BLCA_nonART", "CD8A_BRCA_nonART", "CD8A_COAD_nonART",
//         "CD8A_ESCA_nonART", "CD8A_HNSC_nonART", "CD8A_KICH_nonART",
//         "CD8A_KIRC_nonART", "CD8A_KIRP_nonART", "CD8A_LIHC_nonART",
//         "CD8A_LUAD_nonART", "CD8A_LUSC_nonART", "CD8A_PRAD_nonART",
//         "CD8A_READ_nonART", "CD8A_STAD_nonART", "CD8A_THCA_nonART",
//         "CD8A_UCEC_nonART", "CD4CD8A_BLCA_nonART", "CD4CD8A_BRCA_nonART",
//         "CD4CD8A_HNSC_nonART", "CD4CD8A_KIRC_nonART", "CD4CD8A_KIRP_nonART",
//         "CD4CD8A_LIHC_nonART", "CD4CD8A_LUAD_nonART", "CD4CD8A_LUSC_nonART"
//     ];
// // ipredict部分 更新Cancer Condition下拉菜单
//     function updateCancerConditionOptions() {
//         const cellCondition = document.getElementById("cell_condition").value;
//         const cancerConditionSelect = document.getElementById("cancer_condition");
//         // 筛选出当前有效的组合
//         const validCancerConditions = validCombinations
//             .filter(combination => combination.startsWith(`${cellCondition}_`) && combination.endsWith(`_${ART_condition}`))
//             .map(combination => combination.split("_")[1]); // 提取Cancer Condition
//         // 清空并填充新的选项
//         cancerConditionSelect.innerHTML = "";
//         validCancerConditions.forEach(condition => {
//             const option = document.createElement("option");
//             option.value = condition;
//             option.textContent = condition;
//             cancerConditionSelect.appendChild(option);
//         });
//     }
// // ipredict部分 监听cancer_condition 下拉框的选择，用户选择后运行筛选函数
//     document.getElementById("cancer_condition").addEventListener("change", () => {
//         const cancerCondition = document.getElementById("cancer_condition").value;
//         if (cancerCondition) {
//             // 只有用户选择了有效的 cancer_condition 时运行筛选函数
//             filterSubcellularLocations();
//         }
//     });
// }
// 监听切换按钮的变化情况，重新导入不同模块的数据
// 监听co-regulation部分的变化情况，重新运行filterSubcellularLocations函数
// const modeSelect = document.getElementById("mode");
// // 监听下拉菜单的 change 事件
// modeSelect.addEventListener("change", () => {
//     console.log("Mode changed to:", modeSelect.value); // 调试日志
//     filterSubcellularLocations();
// });
// 加载函数
// ipredict部分
async function loadData() {
    try {
        // 加载 miRNA-target 数据
        const miRResponse = await fetch('./ipredict_miR-Target.json');
        miRTargetData = await miRResponse.json();
        // 加载 TF-miRNA 数据
        const TFMiRNAResponse = await fetch('./TF-miRNA_keep_literature_only.json');
        TFMiRNAData = await TFMiRNAResponse.json();

        // 规范化 TF-miRNA 中的 miRNA 名称
        miRTargetData.forEach(item => {
            item.miRNA = item.miRNA.map(name =>
                name
                    .replace(/\s+/g, '') // 去除空格
                    .replace('Hsa', 'hsa') // 替换 Hsa 为 hsa
                    .replace('-miR', '-mir') // 替换 -mir 为 -miR
            );
        });
        console.log('Loaded miRTargetData:', miRTargetData);
        console.log('Loaded TFMiRNAData (normalized):', TFMiRNAData);
    } catch (error) {
        console.error('Error loading JSON files:', error);
    }
}
// dNADC部分
async function loadData1() {
    try {
        // 加载 miRNA-target 数据
        const miRResponse = await fetch('./dNADC_miR-Target.json');
        miRTargetData = await miRResponse.json();
        // 加载 TF-miRNA 数据
        const TFMiRNAResponse = await fetch('./TF-miRNA_keep_literature_only.json');
        TFMiRNAData = await TFMiRNAResponse.json();

        // 规范化 TF-miRNA 中的 miRNA 名称
        miRTargetData.forEach(item => {
            item.miRNA = item.miRNA.map(name =>
                name
                    .replace(/\s+/g, '') // 去除空格
                    .replace('Hsa', 'hsa') // 替换 Hsa 为 hsa
                    .replace('-miR', '-mir') // 替换 -mir 为 -miR
            );
        });
        console.log('Loaded miRTargetData:', miRTargetData);
        console.log('Loaded TFMiRNAData (normalized):', TFMiRNAData);
    } catch (error) {
        console.error('Error loading JSON files:', error);
    }
}
// rNADC部分
async function loadData2() {
    try {
        // 加载 miRNA-target 数据
        const miRResponse = await fetch('./rNADC_miR-Target.json');
        miRTargetData = await miRResponse.json();
        // 加载 TF-miRNA 数据
        const TFMiRNAResponse = await fetch('./TF-miRNA_keep_literature_only.json');
        TFMiRNAData = await TFMiRNAResponse.json();

        // 规范化 TF-miRNA 中的 miRNA 名称
        miRTargetData.forEach(item => {
            item.miRNA = item.miRNA.map(name =>
                name
                    .replace(/\s+/g, '') // 去除空格
                    .replace('Hsa', 'hsa') // 替换 Hsa 为 hsa
                    .replace('-miR', '-mir') // 替换 -mir 为 -miR
            );
        });
        console.log('Loaded miRTargetData:', miRTargetData);
        console.log('Loaded TFMiRNAData (normalized):', TFMiRNAData);
    } catch (error) {
        console.error('Error loading JSON files:', error);
    }
}

//过滤subcellular condition
// ipredict部分
function filterSubcellularLocations() {
    waitingFunction();
    // 获取用户选择的筛选条件
    const cellCondition = document.getElementById('cell_condition').value;
    const artCondition = ART_condition;
    const cancerCondition = document.getElementById('cancer_condition').value;
    console.log('art:', artCondition);
    console.log('cell:', cellCondition);
    console.log('cancer:', cancerCondition);
    // 筛选 miRNA-target 数据
    let filteredMiRTarget = miRTargetData.filter(item => {
        return (
            (cellCondition ? item.cell_condition.includes(cellCondition) : true) &&
            (artCondition ? item.ART_condition.includes(artCondition) : true) &&
            (cancerCondition ? item.cancer_condition.includes(cancerCondition) : true)
        );
    });
    console.log('miRNA-target:', filteredMiRTarget);
    // 获取用户选择的模式
    let mode = document.getElementById('mode').value;
    console.log('Selected mode:', mode);
    // 根据模式进一步处理数据
    if (mode === 'co-regulation') {
        const filteredMiRTargetCount = filteredMiRTarget.reduce((acc, item) => {
            if (!acc[item.miRNA]) {
                acc[item.miRNA] = new Set();
            }
            acc[item.miRNA].add(item.Target_Gene);
            return acc;
        }, {});
        console.log('miR-target count:', filteredMiRTargetCount);
        // 只保留 target 数量大于 1 的 miRNA
        const targetsWithMultipleRNAs = Object.keys(filteredMiRTargetCount).filter(target => filteredMiRTargetCount[target].size > 1);
        console.log('miRNAs with multiple targets:', targetsWithMultipleRNAs);
        filteredMiRTarget = filteredMiRTarget.filter(item => {
            const miRname = Array.isArray(item.miRNA) ? item.miRNA[0] : item.miRNA;
            return targetsWithMultipleRNAs.includes(miRname);
        });
        console.log('Filtered miRNA-target after co-regulation:', filteredMiRTarget);
    } else {
        console.log('Full mode selected, skipping co-regulation specific processing.');
    }
    // 检查是否有数据
    if (filteredMiRTarget.length === 0) {
        alert('No data available after filtering. Please adjust your criteria.');
        // 恢复显示模式为 "full"
        const modeSelect = document.getElementById("mode");
        modeSelect.value = "full";
        return;
    }
    // 获取当前条件下的最全的target列表
    updateTargetTable(filteredMiRTarget);
    if (!targetPanel.classList.contains('open')) {
        toggleButton.click();
    }
    // toggleButton.click();
    const subcellularCount = {};
    // 提取并统计 Subcellular_location 分类
    filteredMiRTarget.forEach(item => {
        if (item.Subcellular_location) {
            const locations = item.Subcellular_location[0].split(',');
            locations.forEach(location => {
                subcellularCount[location] = (subcellularCount[location] || 0) + 1;
            });
        }
    });
    console.log('Subcellular Locations:', subcellularCount);
    // 将筛选后的 miRNA-target 数据保存到全局变量，供下一步使用
    window.filteredMiRTargetStep1 = filteredMiRTarget;
    // 动态生成勾选框
    displaySubcellularTable(subcellularCount);

    // 直接运行后续的miRNA family筛选部分函数
    // filterData();
}
// dNADC部分
function filterSubcellularLocations1() {
    waitingFunction();
    // 获取用户选择的筛选条件
    const filterCondition = document.getElementById('dnadc_filter').value;
    const artCondition = ART_condition_dNADC;
    const cancerCondition = document.getElementById('dnadc_cancer_condition').value;

    console.log('dNADC - Selected Conditions:', { filterCondition, artCondition, cancerCondition });
    // 筛选 miRNA-target 数据
    let filteredMiRTarget = miRTargetData.filter(item => {
        const matchesFilter = filterCondition === 'A'
            ? ['A', 'L'].includes(item.filter_condition[0])
            : item.filter_condition.includes(filterCondition);
        return (
            (artCondition ? item.ART_condition.includes(artCondition) : true) &&
            (cancerCondition ? item.cancer_condition.includes(cancerCondition) : true) &&
            matchesFilter
        );
    });
console.log('miRNA-target:', filteredMiRTarget);
// 获取用户选择的模式
let mode = document.getElementById('mode').value;
console.log('Selected mode:', mode);
// 根据模式进一步处理数据
if (mode === 'co-regulation') {
    const filteredMiRTargetCount = filteredMiRTarget.reduce((acc, item) => {
        if (!acc[item.miRNA]) {
            acc[item.miRNA] = new Set();
        }
        acc[item.miRNA].add(item.Target_Gene);
        return acc;
    }, {});
    console.log('miR-target count:', filteredMiRTargetCount);
    // 只保留 target 数量大于 1 的 miRNA
    const targetsWithMultipleRNAs = Object.keys(filteredMiRTargetCount).filter(target => filteredMiRTargetCount[target].size > 1);
    console.log('miRNAs with multiple targets:', targetsWithMultipleRNAs);
    filteredMiRTarget = filteredMiRTarget.filter(item => {
        const miRname = Array.isArray(item.miRNA) ? item.miRNA[0] : item.miRNA;
        return targetsWithMultipleRNAs.includes(miRname);
    });
    console.log('Filtered miRNA-target after co-regulation:', filteredMiRTarget);
} else {
    console.log('Full mode selected, skipping co-regulation specific processing.');
}
// 检查是否有数据
if (filteredMiRTarget.length === 0) {
    alert('No data available after filtering. Please adjust your criteria.');
    // 恢复显示模式为 "full"
    const modeSelect = document.getElementById("mode");
    modeSelect.value = "full";
    return;
}
// 获取当前条件下的最全的target列表
updateTargetTable(filteredMiRTarget);
if (!targetPanel.classList.contains('open')) {
        toggleButton.click();
    }
// toggleButton.click();
const subcellularCount = {};
// 提取并统计 Subcellular_location 分类
filteredMiRTarget.forEach(item => {
    if (item.Subcellular_location) {
        const locations = item.Subcellular_location[0].split(',');
        locations.forEach(location => {
            subcellularCount[location] = (subcellularCount[location] || 0) + 1;
        });
    }
});
console.log('Subcellular Locations:', subcellularCount);
// 将筛选后的 miRNA-target 数据保存到全局变量，供下一步使用
window.filteredMiRTargetStep1 = filteredMiRTarget;
// 动态生成勾选框
displaySubcellularTable(subcellularCount);

// 直接运行后续的miRNA family筛选部分函数
// filterData();
}
// rNADC部分
function filterSubcellularLocations2() {
    waitingFunction();
    // 获取用户选择的筛选条件
    const cancerCondition = document.getElementById('rnadc_cancer_condition').value;
    console.log('cancer:', cancerCondition);
    // 筛选 miRNA-target 数据
    let filteredMiRTarget = miRTargetData.filter(item => {
        return (
            (cancerCondition ? item.cancer_condition.includes(cancerCondition) : true)
        );
    });
    console.log('miRNA-target:', filteredMiRTarget);
    // 获取用户选择的模式
    let mode = document.getElementById('mode').value;
    console.log('Selected mode:', mode);
    // 根据模式进一步处理数据
    if (mode === 'co-regulation') {
        const filteredMiRTargetCount = filteredMiRTarget.reduce((acc, item) => {
            if (!acc[item.miRNA]) {
                acc[item.miRNA] = new Set();
            }
            acc[item.miRNA].add(item.Target_Gene);
            return acc;
        }, {});
        console.log('miR-target count:', filteredMiRTargetCount);
        // 只保留 target 数量大于 1 的 miRNA
        const targetsWithMultipleRNAs = Object.keys(filteredMiRTargetCount).filter(target => filteredMiRTargetCount[target].size > 1);
        console.log('miRNAs with multiple targets:', targetsWithMultipleRNAs);
        filteredMiRTarget = filteredMiRTarget.filter(item => {
            const miRname = Array.isArray(item.miRNA) ? item.miRNA[0] : item.miRNA;
            return targetsWithMultipleRNAs.includes(miRname);
        });
        console.log('Filtered miRNA-target after co-regulation:', filteredMiRTarget);
    } else {
        console.log('Full mode selected, skipping co-regulation specific processing.');
    }
    // 检查是否有数据
    if (filteredMiRTarget.length === 0) {
        alert('No data available after filtering. Please adjust your criteria.');
        // 恢复显示模式为 "full"
        const modeSelect = document.getElementById("mode");
        modeSelect.value = "full";
        return;
    }
    // 获取当前条件下的最全的target列表
    updateTargetTable(filteredMiRTarget);
    if (!targetPanel.classList.contains('open')) {
        toggleButton.click();
    }
    // toggleButton.click();
    const subcellularCount = {};
    // 提取并统计 Subcellular_location 分类
    filteredMiRTarget.forEach(item => {
        if (item.Subcellular_location) {
            const locations = item.Subcellular_location[0].split(',');
            locations.forEach(location => {
                subcellularCount[location] = (subcellularCount[location] || 0) + 1;
            });
        }
    });
    console.log('Subcellular Locations:', subcellularCount);
    // 将筛选后的 miRNA-target 数据保存到全局变量，供下一步使用
    window.filteredMiRTargetStep1 = filteredMiRTarget;
    // 动态生成勾选框
    displaySubcellularTable(subcellularCount);
    // 直接运行后续的miRNA family筛选部分函数
    // filterData();
}

function filterData() {
    waitingFunction();
    const checkedLocations = Array.from(
        document.querySelectorAll('#subcellular-table-body input[type="checkbox"]:checked')
    ).map(input => input.value);
    if (checkedLocations.length === 0) {
        alert('Please select at least one Subcellular Location.');
        return;
    }
    console.log('Selected Subcellular Locations:', checkedLocations);
    // 获取第一步筛选结果
    let filteredMiRTarget =  window.filteredMiRTargetStep1.filter(item => {
        if (item.Subcellular_location) {
            const locations = item.Subcellular_location[0].split(',');
            return locations.some(location => checkedLocations.includes(location.trim()));
        }
        return false;
    });
    console.log('Filtered miRNA-target based on Subcellular Location:', filteredMiRTarget);
    // 获取用户选择的模式
    let mode = document.getElementById('mode').value;
    console.log('Selected mode:', mode);
    // 根据模式进一步处理数据
    if (mode === 'co-regulation') {
        const filteredMiRTargetCount = filteredMiRTarget.reduce((acc, item) => {
            if (!acc[item.miRNA]) {
                acc[item.miRNA] = new Set();
            }
            acc[item.miRNA].add(item.Target_Gene);
            return acc;
        }, {});
        console.log('miR-target count:', filteredMiRTargetCount);
        // 只保留 target 数量大于 1 的 miRNA
        const targetsWithMultipleRNAs = Object.keys(filteredMiRTargetCount).filter(target => filteredMiRTargetCount[target].size > 1);
        console.log('miRNAs with multiple targets:', targetsWithMultipleRNAs);
        filteredMiRTarget = filteredMiRTarget.filter(item => {
            const miRname = Array.isArray(item.miRNA) ? item.miRNA[0] : item.miRNA;
            return targetsWithMultipleRNAs.includes(miRname);
        });
        console.log('Filtered miRNA-target after co-regulation:', filteredMiRTarget);
    } else {
        console.log('Full mode selected, skipping co-regulation specific processing.');
    }
    // 检查是否有数据
    if (filteredMiRTarget.length === 0) {
        alert('No data available after filtering. Please adjust your criteria.');
        // 恢复显示模式为 "full"
        const modeSelect = document.getElementById("mode");
        modeSelect.value = "full";
        return;
    }
    // 提取 miR_family 信息
    const miRFamilies = new Map();
    filteredMiRTarget.forEach(item => {
        const family = item.miR_family[0]; // 假设 `miR_family` 是一个数组
        if (miRFamilies.has(family)) {
            miRFamilies.set(family, miRFamilies.get(family) + 1);
        } else {
            miRFamilies.set(family, 1);
        }
    });
    console.log('miRNA Families:', miRFamilies);
    // 暂存筛选结果以供后续使用
    window.filteredMiRTargetStep2 = filteredMiRTarget;
    // 在页面上生成勾选框
    displayMiRFamilyTable(miRFamilies);
    // 更新target的表格
    updateTargetTable(filteredMiRTarget);
}

// 获取miRNA网络，展示网络图
function applyMiRFamilyFilter() {
    waitingFunction();
    // 获取用户勾选的 miRNA Family 条件
    const selectedFamilies = Array.from(
        document.querySelectorAll('#miRFamilyTableBody input[type="checkbox"]:checked')
    ).map(input => input.value);
    if (selectedFamilies.length === 0) {
        alert('Please select at least one miRNA Family.');
        return;
    }
    console.log('Selected miRNA Families:', selectedFamilies);
    // 根据 miRNA Family 筛选 miRNA-target 数据
    let filteredMiRTarget = window.filteredMiRTargetStep2.filter(item =>
        selectedFamilies.includes(item.miR_family[0])
    );
    console.log('Filtered miRNA-target by miRNA Family:', filteredMiRTarget);
    // 更新target的表格
    updateTargetTable(filteredMiRTarget);
    // 获取此时的 miRNA 集合
    const selectedMiRNAs = new Set(filteredMiRTarget.map(item => item.miRNA[0]));
    // 根据当前的 miRNA 集合筛选 TF-miRNA 数据
    const filteredTFMiRNA = TFMiRNAData.filter(item => selectedMiRNAs.has(item.miRNA[0]));
    console.log('Filtered TF-miRNA Data:', filteredTFMiRNA);
    // 统计每个 TF 对应的 miRNA 数量
    const tfMiRNACount = filteredTFMiRNA.reduce((acc, item) => {
        if (!acc[item.TF]) {
            acc[item.TF] = new Set();
        }
        acc[item.TF].add(item.miRNA);
        return acc;
    }, {});
    console.log('TF-miRNA count:', tfMiRNACount);
    // 只保留那些 miRNA 数量大于 1 的 TF
    const tfWithMultipleMiRNAs = Object.keys(tfMiRNACount).filter(tf => tfMiRNACount[tf].size > 1);
    console.log('TFs with multiple miRNAs:', tfWithMultipleMiRNAs);
    // 使用 tfWithMultipleMiRNAs 筛选出对应的 TF-miRNA 关系对
    const filteredTFWithMultipleMiRNAs = filteredTFMiRNA.filter(item => {
        const tfName = Array.isArray(item.TF) ? item.TF[0] : item.TF;
        return tfWithMultipleMiRNAs.includes(tfName);
    });
    console.log('Filtered miRNA-target:', filteredMiRTarget);
    console.log('Filtered TF-miRNA:', filteredTFWithMultipleMiRNAs);
    // 更新全局变量
    globalMiRTargetData = filteredMiRTarget;
    globalTFMiRNAData = filteredTFWithMultipleMiRNAs;
    // 更新 Network Target Table
    // 获取当前条件下的最全的target列表
}
document.getElementById("filter2Button").addEventListener("click", () => {
    updateTargetTable(globalMiRTargetData);
    drawDisjointForceDirectedGraph(globalMiRTargetData, globalTFMiRNAData);
    if (targetPanel.classList.contains('open')) {
        toggleButton.click();
    }else{

    }
});
// -----------
//展示subcellular表格
function displaySubcellularTable(subcellularCount) {
    const tableBody = document.getElementById('subcellular-table-body');
    const selectAllCheckbox = document.getElementById('selectAllSubcellular');
    tableBody.innerHTML = '';
    // 提取 Subcellular 数据，并按首字母排序
    const sortedLocations = Object.keys(subcellularCount).sort((a, b) => a.localeCompare(b));
    sortedLocations.forEach((location,index) => {
        const row = document.createElement('tr');
        // Subcellular location 名称
        const locationCell = document.createElement('td');
        locationCell.textContent = location;
        row.appendChild(locationCell);
        // 复选框
        const selectCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = location;
        checkbox.checked = true;
        // 为复选框绑定事件监听器
        checkbox.addEventListener('change', () => {
            // console.log(`Checkbox for ${location} changed to ${checkbox.checked}`);
            filterData(); // 调用 filterData() 函数，实时更新过滤结果
            if (!targetPanel.classList.contains('open')) {
                toggleButton.click();
            }
        });
        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);
        tableBody.appendChild(row);
    });
    // // 为复选框绑定事件监听器
    // 全选功能
    selectAllCheckbox.checked = true; // 默认选中全选框
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        // 暂时禁用所有复选框的事件监听器
        checkboxes.forEach(checkbox => {
            checkbox.removeEventListener('change', filterData); // 移除监听器
        });
        checkboxes.forEach((checkbox,index) => {
            if (index === 0) {
                checkbox.checked = true;
            } else {
                checkbox.checked = selectAllCheckbox.checked;
            }
            filterData();
            if (!targetPanel.classList.contains('open')) {
                toggleButton.click();
            }
            // 恢复监听器
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    filterData();
                    if (!targetPanel.classList.contains('open')) {
                        toggleButton.click();
                    }
                });
            });
        });
    });
    // 触发默认选中状态的事件
    const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.dispatchEvent(new Event('change')); // 手动触发 change 事件监听器
    });
}

//展示miR family表格
function displayMiRFamilyTable(miRFamilies) {
    const tableBody = document.getElementById('miRFamilyTableBody');
    tableBody.innerHTML = ''; // 清空内容
    // 提取 miRNA Family 数据，并按首字母排序
    const sortedFamilies = Array.from(miRFamilies.keys()).sort((a, b) => a.localeCompare(b));
    sortedFamilies.forEach((family,index) => {
        const row = document.createElement('tr');
        // miR-family 名称
        const familyCell = document.createElement('td');
        familyCell.textContent = family;
        row.appendChild(familyCell);
        // 复选框
        const selectCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = family;
        checkbox.checked = true;
        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);
        tableBody.appendChild(row);
        // 为复选框绑定事件监听器
        checkbox.addEventListener('change', () => {
            applyMiRFamilyFilter(); // 调用 filterData() 函数，实时更新过滤结果
            if (!targetPanel.classList.contains('open')) {
                toggleButton.click();
            }
        });
    });
    // // 显示 miRNA-family 信息的表格
    // document.getElementById('miRFamilySection').style.display = 'block';
    // 全选功能的初始化
    const selectAllCheckbox = document.getElementById('selectAllFamilies');
    selectAllCheckbox.checked = true; // 默认选中全选框
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        const allChecked = selectAllCheckbox.checked;
        // // 暂时禁用所有复选框的事件监听器
        checkboxes.forEach(checkbox => {
            checkbox.removeEventListener('change', applyMiRFamilyFilter); // 移除监听器
        });
        checkboxes.forEach((checkbox,index) => {
            if (index === 0) {
                checkbox.checked = true;
            } else {
                checkbox.checked = allChecked;
            }
            // 在状态更新完成后，手动触发一次过滤逻辑
            applyMiRFamilyFilter();
            if (!targetPanel.classList.contains('open')) {
                toggleButton.click();
            }
            // 恢复监听器
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    applyMiRFamilyFilter();
                    if (!targetPanel.classList.contains('open')) {
                        toggleButton.click();
                    }
                });
            });
        });

    });
    // 自动更新全选状态（如果用户手动取消某个复选框）
    tableBody.addEventListener('change', () => {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        selectAllCheckbox.checked = allChecked;
    });
    // 手动触发默认选中状态的事件
    const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.dispatchEvent(new Event('change')); // 手动触发 change 事件监听器
    });
}
// 更新 Network Target Table 的内容
function updateTargetTable(filteredMiRTarget) {
    const loadingPlaceholder = document.getElementById("loading-placeholder");
    document.getElementById("target-table").style.display = "table";
    document.getElementById("target-table-footer").style.display = "block";
    // 隐藏加载图标
    loadingPlaceholder.style.display = "none";
    const tableBody = document.querySelector("#target-table tbody");
    const footer = document.getElementById('target-table-footer');
    tableBody.innerHTML = ""; // 清空表格内容
    // 使用 Map 对 Target 去重
    const uniqueTargets = Array.from(
        new Map(
            filteredMiRTarget.map(item => [
                item.Target_Gene[0], // Map 的键为 Target_Gene（唯一键）
                {
                    target: item.Target_Gene[0],
                    subcellularLocation: item.Subcellular_location ? item.Subcellular_location[0] : "No data"
                }
            ])
        ).values()
    );
    // 遍历去重后的数据
    uniqueTargets.forEach(item => {
        const row = document.createElement("tr");
        // 添加 Target 列
        const targetCell = document.createElement("td");
        targetCell.textContent = item.target;
        row.appendChild(targetCell);
        // 添加 Subcellular Location 列
        const locationCell = document.createElement("td");
        locationCell.textContent = item.subcellularLocation;
        row.appendChild(locationCell);
        // 将行添加到表格
        tableBody.appendChild(row);
    });
    // 更新统计信息
    const totalTargets = uniqueTargets.length;
    footer.textContent = `Total targets: ${totalTargets}`;
}

function waitingFunction() {
    const loadingPlaceholder = document.getElementById("loading-placeholder");
    // document.querySelector("#target-panel h3").style.display = "none";
    document.getElementById("target-table").style.display = "none";
    document.getElementById("target-table-footer").style.display = "none";
    // 显示加载图标
    loadingPlaceholder.style.display = "flex";
}

//--------------
//下面是绘制网络图的部分
//Disjoint force-directed graph Disjoint情况下的力导向布局，适合网络图被分成很多小簇时数据的展示
function drawDisjointForceDirectedGraph(filteredMiRTarget, filteredTFWithMultipleMiRNAs) {
    const container = d3.select("#network-container");
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;
    document.querySelector("#search-node-button").addEventListener("click", () => {
        const searchInput = document.querySelector("#node-search-input").value.trim();
        if (!searchInput) {
            alert("Please enter a node name to search.");
            return;
        }
        // 在当前图中查找匹配的节点
        const matchedNode =  nodes.find(node => node.id.toLowerCase().trim() === searchInput.toLowerCase().trim());
        if (matchedNode) {
            console.log("Node found:", matchedNode);
            highlightNode(matchedNode); // 调用高亮节点逻辑
        } else {
            alert(`Node "${searchInput}" not found in the network.`);
        }
    });
    // 1. 数据整理：转换成 nodes 和 links 格式
    const nodes = [];
    let links = [];
    // 定义实验条件到颜色的映射
    // 包含Western，PCR，reporter assay，分别有一种颜色；包含其他实验，灰色。每包含1种实验就多一条边
    const experimentColors = {
        "Western ": "#f57f29",
        "PCR": "#d45d6a",
        "reporter": "#4098d7",
        "default": "grey"
    };
    filteredMiRTarget.forEach(item => {
        let miRNA = item.miRNA[0];
        let target = item.Target_Gene[0];
        // 为miRNA和target创建唯一标识符，添加角色信息
        let miRNAId = miRNA + "_miRNA";  // miRNA的标识符
        let targetId = target + "_target"; // 目标基因的标识符

        if (!nodes.some(node => node.id === miRNAId)) nodes.push({ id: miRNAId, group: "miRNA" });
        if (!nodes.some(node => node.id === targetId)) nodes.push({ id: targetId, group: "target" });

        // 解析实验条件
        const experiments = (item.expreiment && item.expreiment.length > 0)
            ? item.expreiment[0].split(',').map(e => e.trim()) // 如果存在，拆分实验条件并去掉多余空格
            : []; // 如果 expreiment 不存在或为空，则返回空数组
        // 为每个实验条件添加边
        experiments.forEach(exp => {
            let matched = false;
            // 遍历实验条件与颜色的映射，匹配字段
            Object.keys(experimentColors).forEach(key => {
                if (exp.toLowerCase().includes(key.toLowerCase())) { // 判断实验条件是否包含对应字段
                    links.push({ source: miRNAId, target: targetId, color: experimentColors[key] });
                    matched = true;
                }
            });
            // 如果实验条件未匹配到任何已定义的字段，使用默认颜色
            if (!matched) {
                links.push({ source: miRNAId, target: targetId, color: experimentColors["default"] });
            }
        });
    });
    // 在调试输出 links
    console.log("Generated nodes:", nodes);
    console.log("Generated links:", links);
    filteredTFWithMultipleMiRNAs.forEach(item => {
        let tf = item.TF[0];
        let miRNA = item.miRNA[0];
        // 为TF和miRNA创建唯一标识符，添加角色信息
        let tfId = tf + "_TF";  // 转录因子的标识符
        let miRNAId = miRNA + "_miRNA";  // miRNA的标识符
        if (!nodes.some(node => node.id === tfId)) nodes.push({ id: tfId, group: "TF" });
        if (!nodes.some(node => node.id === miRNAId)) nodes.push({ id: miRNAId, group: "miRNA" });
        // 根据 relation 字段调整边的样式
        const relation = item.relation ? String(item.relation).split(',').map(r => r.trim()) : [];
        let style = "default"; // 默认样式
        let strokeDasharray = "none"; // 默认实线
        let markerEnd = null; // 默认无箭头
        // 如果包含activation和repression，虚线；如果只包含activation，实线箭头；如果只包含repression，虚线箭头；其他情况，实线
        if (relation.includes("Activation") && relation.includes("Repression")) {
            style = "dashed"; // 虚线
        } else if (relation.includes("Activation")) {
            style = "arrow"; // 箭头
        } else if (relation.includes("Repression")) {
            style = "dashed-arrow"; // 虚线箭头
            strokeDasharray = "5,5"; // 定义虚线
            markerEnd = "url(#arrowhead)"; // 定义箭头
        }
        links.push({
            source: tfId,
            target: miRNAId,
            color: experimentColors["default"],
            style: style,
            strokeDasharray: strokeDasharray,
            markerEnd: markerEnd
        });
    });
    // 修改 links 数据结构，确保 source 和 target 是节点的 id
    links = links.map(link => ({
        ...link, // 保留其他属性，例如 color
        source: typeof link.source === "string" ? nodes.find(node => node.id === link.source) : link.source,
        target: typeof link.target === "string" ? nodes.find(node => node.id === link.target) : link.target
    }));
    console.log("Generated links:", links);

    // 添加 SVG 容器
    // svg.setAttribute("width", width);
    // svg.setAttribute("height", height);
    // svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    // svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    // 清理旧图
    d3.select("#network").selectAll("*").remove();
    const svg = d3.select("#network")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)// 设置 SVG 的视图盒
        .attr("preserveAspectRatio", "xMidYMid meet");
    // 定义缩放行为
    const zoom = d3.zoom()
        .scaleExtent([0.1, 5]) // 设置缩放范围
        .on("zoom", (event) => {
            g.attr("transform", event.transform); // 应用缩放和平移
        });
    // 将缩放行为绑定到 SVG
    svg.call(zoom);
    // 创建一个 g 元素用于平移和缩放
    const g = svg.append("g");
    // 2. 定义力导向模拟器
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(80)) // 链接力
        .force("charge", d3.forceManyBody().strength(d => (d.group === "target" ? -800 : -600))) // 排斥力
        .force("center", d3.forceCenter(width / 2, height / 2)) // 居中力
        .force("target_center", d3.forceRadial(0, width / 2, height / 2).strength(d => (d.group === "target" ? 0.8 : 0))) // Target 节点居中)
        .force("miRNA_radial", d3.forceRadial(400, width / 2, height / 2).strength(d => (d.group === "miRNA" ? 0.8 : 0))) // miRNA 环绕
        .force("TF_radial", d3.forceRadial(500, width / 2, height / 2).strength(d => (d.group === "TF" ? 0.8 : 0))); // TF 外围
    // 4. 绘制边
    const link = g.append("g")
        .attr("class", "links")
        .attr("stroke-opacity", 1)
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("fill", "none")
        .attr("stroke", d => d.color) // 根据 links 的 color 属性设置边的颜色
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", d => {
            console.log("Stroke Dasharray for edge:", d.strokeDasharray); // 调试日志
            return d.strokeDasharray;
        }) // 虚线
        .attr("marker-end", d => {
            console.log("Marker End for edge:", d.markerEnd); // 调试日志
            return d.markerEnd;
        }) // 箭头
        .attr("d", d => calculatePath(d, links)); // 使用 calculatePath 函数计算路径

    // 动态调整箭头位置函数
    function getArrowRefX(nodeRadius) {
        return nodeRadius + 25; // 箭头位置基于节点半径 + 一些额外的偏移
    }
    // 定义箭头标记
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", getArrowRefX(20))
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "black");

    // 5. 绘制节点组
    const node = g.append("g")
        .attr("class", "node")
        .selectAll("g")
        .data(nodes)
        .enter().append("g") // 每个节点的容器
        .attr("class", "node");
    // 绘制节点形状
    node.append("circle")
        .attr("r", 20) // 节点半径
        .attr("fill", d => d.group === "miRNA" ? "#a6c8ff" : d.group === "TF" ? "#a3e4a1" : "#f1e0a4")
        .attr("stroke", d => d.group === "miRNA" ? "#fff" : d.group === "TF" ? "#fff" : "#fff") // 边框颜色与填充一致
        .attr("stroke-width", 0.5) // 更细的边框
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
    // 添加节点标签
    node.append("text")
        .attr("text-anchor", "middle") // 文本居中
        .attr("dy", "0.35em") // 垂直居中
        .text(d => d.id.replace(/_(target|TF|miRNA)$/, "")) // 显示节点名称,去掉节点的唯一标识符
        .style("font-size", "12px") // 字体大小
        .style("font-weight", "bold") // 加粗
        .style("fill", "black") // 字体颜色为白色
        .style("pointer-events", "none") // 禁止干扰鼠标事件
        .style("user-select", "none"); // 禁止文本被选中
    // 6. 力学模拟更新位置
    simulation.on("tick", () => {
        link.attr("d", d => calculatePath(d, links));
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    node.on("click", (event, d) => {
        event.stopPropagation();
        highlightNode(d);

    });
    // 为 SVG 背景添加点击事件，清除高亮
    svg.on("click", () => {
        resetHighlight(); // 清除所有高亮
    });
    // 7. 高亮功能
    function highlightNode(selectedNode) {
        // 获取与当前节点相连的边和节点
        const connectedLinks = links.filter(link => link.source.id === selectedNode.id || link.target.id === selectedNode.id);
        const connectedNodes = new Set(connectedLinks.flatMap(link => [link.source.id, link.target.id]));
        // 更新边样式
        link.attr("stroke-opacity", d => connectedNodes.has(d.source.id) && connectedNodes.has(d.target.id) ? 1 : 0.1)
        // 更新节点样式
        node.select("circle")
            .attr("fill-opacity", d => connectedNodes.has(d.id) ? 1 : 0.1) // 高亮节点透明度变高
            .attr("stroke-opacity", d => connectedNodes.has(d.id) ? 1 : 0.1) // 非相关节点透明
            .attr("stroke", d => d.id === connectedNodes.has(d.id) ? "#f00" : "#fff") // 高亮当前节点边框
            .attr("stroke-width", d => d.id === connectedNodes.has(d.id) ? 1 : 0.5); // 高亮当前节点加粗边框
    }
    // 8. 清除高亮
    function resetHighlight() {
        // 重置边样式
        link.attr("stroke-opacity", 1)
            .attr("stroke-width", 1); // 边恢复正常宽度
        // 重置节点样式
        node.select("circle")
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);
    }
    // 拖拽行为函数
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    // 计算路径函数
    function calculatePath(d, links) {
        const sameEdgeGroup = links.filter(
            edge =>
                (edge.source.id === d.source.id && edge.target.id === d.target.id) ||
                (edge.source.id === d.target.id && edge.target.id === d.source.id)
        );
        const index = sameEdgeGroup.indexOf(d); // 当前边在组内的索引
        const offset = (index - (sameEdgeGroup.length - 1) / 2) * 500; // 偏移量
        const curvature = 0.5; // 曲率调整
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * (1 + Math.abs(offset) * curvature); // 根据偏移量调整曲率
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    }
}

//下载表格
function downloadDataAsTabDelimited(data, fileName) {
    let content = '';

    // 检查是否有数据
    if (data.length > 0) {
        // 获取数据的表头（从数据的键提取）
        const headers = Object.keys(data[0]);
        content += headers.join('\t') + '\n'; // 使用制表符分隔表头

        // 填充每一行数据
        data.forEach(item => {
            const row = headers.map(key => Array.isArray(item[key]) ? item[key].join(', ') : item[key] || '').join('\t');
            content += row + '\n';
        });
    } else {
        // 如果没有数据，给出提示
        content = 'No data available to download.\n';
    }
    // 创建 Blob 对象以触发下载
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName; // 设置下载文件名
    link.click();
}
// 下载文件的事件监听器
document.getElementById("download1").addEventListener("click", () => {
    downloadDataAsTabDelimited(globalMiRTargetData,'miRNA-Target-Data.txt');
});
document.getElementById("download2").addEventListener("click", () => {
    downloadDataAsTabDelimited(globalTFMiRNAData,'TF-miRNA-Data.txt');
});