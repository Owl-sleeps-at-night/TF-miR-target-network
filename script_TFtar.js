(function() {
let TFTargetData = [];
let globalTFTargetData = []; // 全局变量，用于存储筛选后的 tf-target 数据

// 设置默认激活按钮
// 包裹逻辑到一个初始化函数中
    function initializeScriptA() {
        console.log('script3 initialized.');
        // 检查当前激活的模块
        let activeModule = null;
        // 方法 1：通过全局变量获取当前激活模块（需要全局维护 activeNADCButton）
        if (typeof activeNADCButton !== 'undefined' && activeNADCButton) {
            activeModule = activeNADCButton;
        }
        // 方法 2：从页面元素中获取当前激活模块
        if (!activeModule) {
            const activeButton = document.querySelector('.nadc-button.active');
            if (activeButton) {
                activeModule = activeButton.id.replace('btn-', ''); // 去掉 'btn-' 前缀
            }
        }
        // 如果未找到激活模块，回退到默认模块
        if (!activeModule) {
            activeModule = 'ipredict'; // 默认模块
        }
        console.log('Running logic for active module:', activeModule);
        // 根据当前模块运行逻辑
        handleNADCButtonClick(activeModule);
    }

// 如果直接加载脚本，则自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScriptA);
} else {
    initializeScriptA();
}

// 添加按钮点击事件监听器
nadcButtons.forEach(button => {
    button.addEventListener('click', () => {
        const buttonId = button.id.replace('btn-', ''); // 获取按钮对应的功能名
        // const buttonId = activeNADCButton;
        // 更新激活状态
        // nadcButtons.forEach(btn => btn.classList.remove('active')); // 清除其他按钮的激活状态
        // button.classList.add('active'); // 激活当前按钮
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
     TFTargetData = [];
     globalTFTargetData = [];
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
    document.getElementById("cell_condition").value='CD4';
    document.getElementById("cancer_condition").value='BLCA';
    filterGenefamily();
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
        filterGenefamily();
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
            filterGenefamily();
        }
    });
    // 监听切换按钮的变化情况，重新导入不同模块的数据
    // 监听co-regulation部分的变化情况，重新运行filterGenefamily函数
    const modeSelect = document.getElementById("mode");
    // 监听下拉菜单的 change 事件
    modeSelect.addEventListener("change", () => {
        console.log("Mode changed to:", modeSelect.value); // 调试日志
        filterGenefamily();
    });
}


async function runDNADCLogic(){
    await loadData1(); // 默认加载dNADC数据
    // dNADC初始参数
    ART_condition_dNADC="ART";
    document.getElementById("ART_yes_dnadc").checked=true;
    document.getElementById("ART_no_dnadc").checked=false;
    document.getElementById("dnadc_filter").value='A';
    document.getElementById("dnadc_cancer_condition").value='BLCA';
    filterGenefamily1();
    document.getElementById("dnadc_filter").addEventListener("change", () => {
        const modeSelect = document.getElementById("mode");
        modeSelect.value = "full";
        document.getElementById("ART_yes_dnadc").checked=false;
        document.getElementById("ART_no_dnadc").checked=false;
    });
    // 为YES和NO按钮添加事件监听
    document.getElementById("ART_yes_dnadc").addEventListener("click", (event) => {
        if (event.target.checked) {
            setARTCondition1("ART");
        }
    });
    document.getElementById("ART_no_dnadc").addEventListener("click", (event) => {
        if (event.target.checked) {
            setARTCondition1("nonART");
        }
    });
    function setARTCondition1(condition) {
        const modeSelect = document.getElementById("mode");
        modeSelect.value = "full";
        ART_condition_dNADC= condition;
        // 更新按钮的状态
        document.getElementById("ART_yes_dnadc").checked=(condition === "ART");
        document.getElementById("ART_no_dnadc").checked=(condition === "nonART");
        // 更新Cancer Condition下拉菜单
        filterGenefamily1();
    }
    // dNADC部分 监听cancer_condition 下拉框的选择，用户选择后运行筛选函数
    document.getElementById("dnadc_cancer_condition").addEventListener("change", () => {
        const modeSelect = document.getElementById("mode");
        modeSelect.value = "full";
        const cancerCondition = document.getElementById("dnadc_cancer_condition").value;
        if (cancerCondition) {
            // 只有用户选择了有效的 cancer_condition 时运行筛选函数
            filterGenefamily1();
        }
    });
    // 监听切换按钮的变化情况，重新导入不同模块的数据
    // 监听co-regulation部分的变化情况，重新运行filterGenefamily函数
    const modeSelect = document.getElementById("mode");
    // 监听下拉菜单的 change 事件
    modeSelect.addEventListener("change", () => {
        console.log("Mode changed to:", modeSelect.value); // 调试日志
        filterGenefamily1();
    });
}


async function runRNADCLogic(){
    await loadData2(); // 默认加载dNADC数据
    // rNADC初始参数
    document.getElementById('rnadc_cancer_condition').value='ACC';
    filterGenefamily2();
    // rNADC部分 监听cancer_condition 下拉框的选择，用户选择后运行筛选函数
    document.getElementById("rnadc_cancer_condition").addEventListener("change", () => {
        const cancerCondition = document.getElementById("rnadc_cancer_condition").value;
        if (cancerCondition) {
            // 只有用户选择了有效的 cancer_condition 时运行筛选函数
            filterGenefamily2();
        }
    });
    // 监听切换按钮的变化情况，重新导入不同模块的数据
    // 监听co-regulation部分的变化情况，重新运行filterGenefamily函数
    const modeSelect = document.getElementById("mode");
    // 监听下拉菜单的 change 事件
    modeSelect.addEventListener("change", () => {
        console.log("Mode changed to:", modeSelect.value); // 调试日志
        filterGenefamily2();
    });
}

// 加载函数
// ipredict部分
async function loadData() {
    try {
        // 加载 TF-target 数据
        const TFResponse = await fetch('./ipredict_TF-Target.json');
        TFTargetData = await TFResponse.json();

        console.log('Loaded TFTargetData:', TFTargetData);
    } catch (error) {
        console.error('Error loading JSON files:', error);
    }
}
// dNADC部分
async function loadData1() {
    try {
        // 加载 TF-target 数据
        const TFResponse = await fetch('./dNADC_TF-Target.json');
        TFTargetData = await TFResponse.json();

        console.log('Loaded TFTargetData:', TFTargetData);
    } catch (error) {
        console.error('Error loading JSON files:', error);
    }
}
// rNADC部分
async function loadData2() {
    try {
        // 加载 TF-target 数据
        const TFResponse = await fetch('./rNADC_TF-Target.json');
        TFTargetData = await TFResponse.json();

        console.log('Loaded TFTargetData:', TFTargetData);
    } catch (error) {
        console.error('Error loading JSON files:', error);
    }
}

//过滤gene family
// ipredict部分
function filterGenefamily() {
    // waitingFunction();
    // 获取用户选择的筛选条件
    const cellCondition = document.getElementById('cell_condition').value;
    const artCondition = ART_condition;
    const cancerCondition = document.getElementById('cancer_condition').value;
    console.log('art:', artCondition);
    console.log('cell:', cellCondition);
    console.log('cancer:', cancerCondition);
    // 筛选 miRNA-target 数据
    let filteredTFTarget = TFTargetData.filter(item => {
        return (
            (cellCondition ? item.cell_condition.includes(cellCondition) : true) &&
            (artCondition ? item.ART_condition.includes(artCondition) : true) &&
            (cancerCondition ? item.cancer_condition.includes(cancerCondition) : true)
        );
    });
    console.log('TF-target:', filteredTFTarget);
    if(filteredTFTarget.length === 0){
        alert('No TFs known to regulate the given features, please select another NADC.');
        runiPredictLogic();
        return;
    }
    // 获取用户选择的模式
    let mode = document.getElementById('mode').value;
    console.log('Selected mode:', mode);
    // 根据模式进一步处理数据
    if (mode === 'co-regulation') {
        const filteredTFTargetCount = filteredTFTarget.reduce((acc, item) => {
            if (!acc[item.TF]) {
                acc[item.TF] = new Set();
            }
            acc[item.TF].add(item.Target_Gene);
            return acc;
        }, {});
        console.log('TF-target count:', filteredTFTargetCount);
        // 只保留 target 数量大于 1 的 miRNA
        const targetsWithMultipleTFs = Object.keys(filteredTFTargetCount).filter(target => filteredTFTargetCount[target].size > 1);
        console.log('miRNAs with multiple targets:', targetsWithMultipleTFs);
        filteredTFTarget = filteredTFTarget.filter(item => {
            const TFname = Array.isArray(item.TF) ? item.TF[0] : item.TF;
            return targetsWithMultipleTFs.includes(TFname);
        });
        console.log('Filtered TF-target after co-regulation:', filteredTFTarget);
    } else {
        console.log('Full mode selected, skipping co-regulation specific processing.');
    }
    // 检查是否有数据
    if (filteredTFTarget.length === 0) {
        alert('No data available after filtering. Please adjust your criteria.');
        // 恢复显示模式为 "full"
        const modeSelect = document.getElementById("mode");
        modeSelect.value = "full";
        // return;
        filterGenefamily();
        return;
    }
    // 获取当前条件下的最全的target列表
    updateTargetTable(filteredTFTarget);
    if (!targetPanel.classList.contains('open')) {
        toggleButton.click();
    }
    // toggleButton.click();
    const GenefamilyCount = {};
    // 提取并统计 Subcellular_location 分类
    filteredTFTarget.forEach(item => {
        if (item.gene_family) {
            const locations = item.gene_family[0].split(',');
            locations.forEach(location => {
                GenefamilyCount[location] = (GenefamilyCount[location] || 0) + 1;
            });
        }
    });
    console.log('Gene family:', GenefamilyCount);
    // 将筛选后的 miRNA-target 数据保存到全局变量，供下一步使用
    window.filteredTFTargetStep1 = filteredTFTarget;
    // 动态生成勾选框
    displayGenefamilyTable(GenefamilyCount);
}

// dNADC部分
    function filterGenefamily1() {
        // waitingFunction();
        const filterCondition = document.getElementById('dnadc_filter').value;
        const artCondition = ART_condition_dNADC;
        const cancerCondition = document.getElementById('dnadc_cancer_condition').value;
        console.log('dNADC - Selected Conditions:', { filterCondition, artCondition, cancerCondition });
        // 筛选 miRNA-target 数据
        let filteredTFTarget = TFTargetData.filter(item => {
            const matchesFilter = filterCondition === 'A'
                ? ['A', 'L'].includes(item.filter_condition[0])
                : item.filter_condition.includes(filterCondition);
            return (
                (artCondition ? item.ART_condition.includes(artCondition) : true) &&
                (cancerCondition ? item.cancer_condition.includes(cancerCondition) : true) &&
                matchesFilter
            );
        });
        console.log('TF-target:', filteredTFTarget);
        if(filteredTFTarget.length === 0){
            alert('No TFs known to regulate the given features, please select another NADC.');
            runDNADCLogic();
            return;
        }
        // 获取用户选择的模式
        let mode = document.getElementById('mode').value;
        console.log('Selected mode:', mode);
        // 根据模式进一步处理数据
        if (mode === 'co-regulation') {
            const filteredTFTargetCount = filteredTFTarget.reduce((acc, item) => {
                if (!acc[item.TF]) {
                    acc[item.TF] = new Set();
                }
                acc[item.TF].add(item.Target_Gene);
                return acc;
            }, {});
            console.log('TF-target count:', filteredTFTargetCount);
            // 只保留 target 数量大于 1 的 miRNA
            const targetsWithMultipleTFs = Object.keys(filteredTFTargetCount).filter(target => filteredTFTargetCount[target].size > 1);
            console.log('miRNAs with multiple targets:', targetsWithMultipleTFs);
            filteredTFTarget = filteredTFTarget.filter(item => {
                const TFname = Array.isArray(item.TF) ? item.TF[0] : item.TF;
                return targetsWithMultipleTFs.includes(TFname);
            });
            console.log('Filtered TF-target after co-regulation:', filteredTFTarget);
        } else {
            console.log('Full mode selected, skipping co-regulation specific processing.');
        }
        // 检查是否有数据
        if (filteredTFTarget.length === 0) {
            alert('No data available after filtering. Please adjust your criteria.');
            // 恢复显示模式为 "full"
            const modeSelect = document.getElementById("mode");
            modeSelect.value = "full";
            // return;
            filterGenefamily();
            return;
        }
        // 获取当前条件下的最全的target列表
        updateTargetTable(filteredTFTarget);
        if (!targetPanel.classList.contains('open')) {
            toggleButton.click();
        }
        // toggleButton.click();
        const GenefamilyCount = {};
        // 提取并统计 Subcellular_location 分类
        filteredTFTarget.forEach(item => {
            if (item.gene_family) {
                const locations = item.gene_family[0].split(',');
                locations.forEach(location => {
                    GenefamilyCount[location] = (GenefamilyCount[location] || 0) + 1;
                });
            }
        });
        console.log('Gene family:', GenefamilyCount);
        // 将筛选后的 miRNA-target 数据保存到全局变量，供下一步使用
        window.filteredTFTargetStep1 = filteredTFTarget;
        // 动态生成勾选框
        displayGenefamilyTable(GenefamilyCount);
    }

    // rNADC部分
    function filterGenefamily2() {
        // waitingFunction();
        // 获取用户选择的筛选条件
        const cancerCondition = document.getElementById('rnadc_cancer_condition').value;
        console.log('cancer:', cancerCondition);
        // 筛选 miRNA-target 数据
        let filteredTFTarget = TFTargetData.filter(item => {
            return (
                (cancerCondition ? item.cancer_condition.includes(cancerCondition) : true)
            );
        });
        console.log('TF-target:', filteredTFTarget);
        if(filteredTFTarget.length === 0){
            alert('No TFs known to regulate the given features, please select another NADC.');
            runRNADCLogic();
            return;
        }
        // 获取用户选择的模式
        let mode = document.getElementById('mode').value;
        console.log('Selected mode:', mode);
        // 根据模式进一步处理数据
        if (mode === 'co-regulation') {
            const filteredTFTargetCount = filteredTFTarget.reduce((acc, item) => {
                if (!acc[item.TF]) {
                    acc[item.TF] = new Set();
                }
                acc[item.TF].add(item.Target_Gene);
                return acc;
            }, {});
            console.log('TF-target count:', filteredTFTargetCount);
            // 只保留 target 数量大于 1 的 miRNA
            const targetsWithMultipleTFs = Object.keys(filteredTFTargetCount).filter(target => filteredTFTargetCount[target].size > 1);
            console.log('miRNAs with multiple targets:', targetsWithMultipleTFs);
            filteredTFTarget = filteredTFTarget.filter(item => {
                const TFname = Array.isArray(item.TF) ? item.TF[0] : item.TF;
                return targetsWithMultipleTFs.includes(TFname);
            });
            console.log('Filtered TF-target after co-regulation:', filteredTFTarget);
        } else {
            console.log('Full mode selected, skipping co-regulation specific processing.');
        }
        // 检查是否有数据
        if (filteredTFTarget.length === 0) {
            alert('No data available after filtering. Please adjust your criteria.');
            // 恢复显示模式为 "full"
            const modeSelect = document.getElementById("mode");
            modeSelect.value = "full";
            // return;
            filterGenefamily();
            return;
        }
        // 获取当前条件下的最全的target列表
        updateTargetTable(filteredTFTarget);
        if (!targetPanel.classList.contains('open')) {
            toggleButton.click();
        }
        // toggleButton.click();
        const GenefamilyCount = {};
        // 提取并统计 Subcellular_location 分类
        filteredTFTarget.forEach(item => {
            if (item.gene_family) {
                const locations = item.gene_family[0].split(',');
                locations.forEach(location => {
                    GenefamilyCount[location] = (GenefamilyCount[location] || 0) + 1;
                });
            }
        });
        console.log('Gene family:', GenefamilyCount);
        // 将筛选后的 miRNA-target 数据保存到全局变量，供下一步使用
        window.filteredTFTargetStep1 = filteredTFTarget;
        // 动态生成勾选框
        displayGenefamilyTable(GenefamilyCount);
    }


//展示subcellular表格
function displayGenefamilyTable(GenefamilyCount) {
    console.log('displaygenefamily function loaded.')
    const tableBody = document.getElementById('geneFamilyTableBody');
    const selectAllCheckbox = document.getElementById('selectAllGeneFamilies');
    tableBody.innerHTML = '';
    // 提取 Subcellular 数据，并按首字母排序
    const sortedLocations = Object.keys(GenefamilyCount).sort((a, b) => a.localeCompare(b));
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

        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);
        tableBody.appendChild(row);
    });
    // 手动触发默认全选的逻辑，只执行一次
    function triggerInitialFilter() {
        filterData(); // 调用过滤函数
        if (!targetPanel.classList.contains('open')) {
            toggleButton.click();
        }
    }
    // // 为复选框绑定事件监听器
    // 全选功能
    selectAllCheckbox.checked = true; // 默认选中全选框
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        const allChecked = selectAllCheckbox.checked;

        checkboxes.forEach((checkbox,index) => {
            if (index === 0) {
                checkbox.checked = true;
            } else {
                checkbox.checked = allChecked;
            }
            // 手动触发 change 事件
            filterData();
            if (!targetPanel.classList.contains('open')) {
                toggleButton.click();
            }
        });
    });
    // 自动更新全选状态（如果用户手动取消某个复选框）
    tableBody.addEventListener('change', (event) => {
        const target =event.target;
        if (target && target.type === 'checkbox') {
            const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
            // 如果某个复选框状态改变，则更新全选框状态
            const allChecked = Array.from(checkboxes).every((checkbox, index) => checkbox.checked || index === 0);
            selectAllCheckbox.checked = allChecked;
            filterData();
            if (!targetPanel.classList.contains('open')) {
                toggleButton.click();
            }
        }
    });
    triggerInitialFilter();
}

function filterData() {

    const checkedLocations = Array.from(
        document.querySelectorAll('#geneFamilyTableBody input[type="checkbox"]:checked')
    ).map(input => input.value);
    if (checkedLocations.length === 0) {
        alert('Please select at least one gene family.');
        return;
    }
    console.log('Selected gene families:', checkedLocations);
    // 获取第一步筛选结果
    let filteredTFTarget =  window.filteredTFTargetStep1.filter(item => {
        if (item.gene_family) {
            const locations = item.gene_family[0].split(',');
            return locations.some(location => checkedLocations.includes(location.trim()));
        }
        return false;
    });
    console.log('Filtered TF-target based on gene family:', filteredTFTarget);
    // 获取用户选择的模式
    let mode = document.getElementById('mode').value;
    console.log('Selected mode:', mode);
    // 根据模式进一步处理数据
    if (mode === 'co-regulation') {
        const filteredTFTargetCount = filteredTFTarget.reduce((acc, item) => {
            if (!acc[item.TF]) {
                acc[item.TF] = new Set();
            }
            acc[item.TF].add(item.Target_Gene);
            return acc;
        }, {});
        console.log('TF-target count:', filteredTFTargetCount);
        // 只保留 target 数量大于 1 的 miRNA
        const targetsWithMultipleTFs = Object.keys(filteredTFTargetCount).filter(target => filteredTFTargetCount[target].size > 1);
        console.log('TFs with multiple targets:', targetsWithMultipleTFs);
        filteredTFTarget = filteredTFTarget.filter(item => {
            const TFname = Array.isArray(item.TF) ? item.TF[0] : item.TF;
            return targetsWithMultipleTFs.includes(TFname);
        });
        console.log('Filtered TF-target after co-regulation:', filteredTFTarget);
    } else {
        console.log('Full mode selected, skipping co-regulation specific processing.');
    }
    // 检查是否有数据
    if (filteredTFTarget.length === 0) {
        alert('No data available after filtering. Please adjust your criteria.');
        filterData();
        return;
    }

    // 暂存筛选结果以供后续使用
    window.filteredTFTargetStep2 = filteredTFTarget;
    applyGeneFamilyFilter()
    // 更新target的表格
    updateTargetTable(filteredTFTarget);
    console.log('filtered TFTarget_filterData:', filteredTFTarget);
}

// 获取miRNA网络，展示网络图
function applyGeneFamilyFilter() {

    // 根据 miRNA Family 筛选 TF-target 数据
    let filteredTFTarget = window.filteredTFTargetStep2;
    // 更新target的表格
    updateTargetTable(filteredTFTarget);
    console.log('filtered TFTarget_filteredTFTarget:', filteredTFTarget);
    // 更新全局变量
    globalTFTargetData = filteredTFTarget;

}
document.getElementById("filter2Button").addEventListener("click", () => {
    console.log('globalTFTargetData:', globalTFTargetData);

    // updateTargetTable(globalMiRTargetData);
    drawDisjointForceDirectedGraph(globalTFTargetData);
    if (targetPanel.classList.contains('open')) {
        toggleButton.click();
    }else{

    }
});


// 更新 Network Target Table 的内容
function updateTargetTable(filteredTFTarget) {
    const loadingPlaceholder = document.getElementById("loading-placeholder");
    // document.getElementById("target-table_TF-target").style.display = "table";
    document.getElementById("target-table-footer_TF-target").style.display = "block";
    document.getElementById("target-table-footer").style.display = "none";
    document.getElementById("target-table").style.display = "none";
    // 隐藏加载图标
    loadingPlaceholder.style.display = "none";
    const tableBody = document.querySelector("#target-table_TF-target tbody");
    const footer = document.getElementById('target-table-footer_TF-target');
    tableBody.innerHTML = ""; // 清空表格内容
    // 使用 Map 对 Target 去重
    const uniqueTargets = Array.from(
        new Map(
            filteredTFTarget.map(item => [
                item.Target_Gene[0], // Map 的键为 Target_Gene（唯一键）
                {
                    target: item.Target_Gene[0],
                    gene_family: item.gene_family ? item.gene_family[0] : "NA"
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
        locationCell.textContent = item.gene_family;
        row.appendChild(locationCell);
        // 将行添加到表格
        tableBody.appendChild(row);
    });
    // 更新统计信息
    const totalTargets1 = uniqueTargets.length;
    footer.textContent = `Total targets: ${totalTargets1}`;
}

//下面是绘制网络图的部分
//Disjoint force-directed graph Disjoint情况下的力导向布局，适合网络图被分成很多小簇时数据的展示
function drawDisjointForceDirectedGraph(filteredTFTarget) {
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
        const matchedNode =  nodes.find(node => node.id.toLowerCase().trim().replace(/_(target|TF|miRNA)$/, "") === searchInput.toLowerCase().trim());
        if (matchedNode) {
            console.log("Nodes found:", matchedNode);
            // 遍历所有匹配的节点并应用高亮逻辑
            // matchedNodes.forEach(matchedNode => {
            //     highlightMultipleNodes(matchedNode); // 调用高亮节点逻辑
            // });
            highlightNode(matchedNode); // 调用高亮节点逻辑
        } else {
            alert(`Node "${searchInput}" not found in the network.`);
        }
    });
    // 1. 数据整理：转换成 nodes 和 links 格式
    const nodes = [];
    let links = [];

    filteredTFTarget.forEach(item => {
        let TF = item.TF[0];
        let target = item.Target_Gene[0];
        // 为miRNA和target创建唯一标识符，添加角色信息
        let TFId = TF + "_TF";  // miRNA的标识符
        let targetId = target + "_target"; // 目标基因的标识符

        if (!nodes.some(node => node.id === TFId)) nodes.push({ id: TFId, group: "TF" });
        if (!nodes.some(node => node.id === targetId)) nodes.push({ id: targetId, group: "target" });

        const regulation = item.regulation[0] || '';
        const regulationArr = regulation.split(',');
        const hasActivation = regulationArr.includes("Activation");
        const hasRepression = regulationArr.includes("Repression");
        let style = "default"; // 默认样式
        let strokeDasharray = "none"; // 默认实线
        let markerEnd = null; // 默认无箭头
        // 边的形状判定
        if (hasActivation && !hasRepression) {
            style = "arrow"; // 实线箭头
        } else if (!hasActivation && hasRepression) {
            style='dashed-arrow';
            strokeDasharray = "5,5"; // 虚线
            markerEnd="url(#arrowhead)";
        } else if (hasActivation && hasRepression) {
            style ='dashed';
        }

        // 根据 IN_TRRUST, IN_hTFtarget, IN_GRNdb 决定颜色
        if (item.IN_TRRUST[0] === 1) {
            links.push({ source: TFId, target: targetId, color: "#d45d6a", style: style, strokeDasharray:strokeDasharray,markerEnd: markerEnd});
        }
        if (item.IN_hTFtarget[0] === 1) {
            links.push({ source: TFId, target: targetId, color: "#f57f29", style: style, strokeDasharray:strokeDasharray,markerEnd: markerEnd });
        }
        if (item.IN_GRNdb[0] === 1) {
            links.push({ source: TFId, target: targetId, color: "grey", style: style, strokeDasharray:strokeDasharray,markerEnd: markerEnd });
        }

    });
    // 在调试输出 links
    console.log("Generated nodes:", nodes);
    console.log("Generated links:", links);

    // 修改 links 数据结构，确保 source 和 target 是节点的 id
    links = links.map(link => ({
        ...link, // 保留其他属性，例如 color
        source: typeof link.source === "string" ? nodes.find(node => node.id === link.source) : link.source,
        target: typeof link.target === "string" ? nodes.find(node => node.id === link.target) : link.target
    }));
    console.log("Generated links:", links);
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
        .force("TF_radial", d3.forceRadial(400, width / 2, height / 2).strength(d => (d.group === "TF" ? 0.8 : 0))) // TF 环绕

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
            console.log("Stroke Dasharray for edge:", d.shape); // 调试日志
            return d.shape;
        }) // 虚线
        .attr("d", d => calculatePath(d, links))// 使用 calculatePath 函数计算路径
        .attr("marker-end", d => {
            console.log("Marker End for edge:", d.markerEnd); // 调试日志
            return d.markerEnd;
        }); // 箭头

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
        .attr("fill", d => d.group === "TF" ? "#a3e4a1" : "#f1e0a4")
        .attr("stroke", d => d.group === "TF" ? "#fff" : "#fff") // 边框颜色与填充一致
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
        console.log('Selected node:', selectedNode)
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
    // 只在搜索节点时才允许使用的特殊情况，允许高亮两个以上节点
    function highlightMultipleNodes(selectedNodes) {
        // 获取与选定节点相连的所有边和节点
        const connectedLinks = links.filter(link =>
            selectedNodes.some(node => node.id === link.source.id || node.id === link.target.id)
        );
        // 创建一个集合来存储所有相关节点（选定的节点和它们连接的节点）
        const connectedNodes = new Set(
            connectedLinks.flatMap(link => [link.source.id, link.target.id])
        );
        // 更新边的样式
        link.attr("stroke-opacity", d =>
            connectedNodes.has(d.source.id) && connectedNodes.has(d.target.id) ? 1 : 0.1
        );
        // 更新节点样式
        node.select("circle")
            .attr("fill-opacity", d => connectedNodes.has(d.id) ? 1 : 0.1)  // 高亮节点透明度变高
            .attr("stroke-opacity", d => connectedNodes.has(d.id) ? 1 : 0.1) // 非相关节点透明
            .attr("stroke", d => connectedNodes.has(d.id) ? "#f00" : "#fff") // 高亮节点边框
            .attr("stroke-width", d => connectedNodes.has(d.id) ? 1 : 0.5);  // 高亮节点加粗边框
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
document.getElementById("download3").removeEventListener("click", handleDownload);
document.getElementById("download3").addEventListener("click", handleDownload);
    function handleDownload() {
        downloadDataAsTabDelimited(globalTFTargetData, 'TF-Target-Data.txt');
    }

})();