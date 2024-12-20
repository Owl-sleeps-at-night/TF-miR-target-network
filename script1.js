let miRTargetData = [];
let TFMiRNAData = [];
let globalMiRTargetData = []; // 全局变量，用于存储筛选后的 miRNA-target 数据
let globalTFMiRNAData = []; // 全局变量，用于存储筛选后的 TF-miRNA 数据
// 加载 JSON 文件
async function loadData() {
    try {
        // 加载 miRNA-target 数据
        const miRResponse = await fetch('./ipredict_miR-Target.json');
        miRTargetData = await miRResponse.json();

        // 加载 TF-miRNA 数据
        const TFMiRNAResponse = await fetch('./TF-miRNA_12_8_literature_and_level2.json');
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

function filterSubcellularLocations() {
    // 获取用户选择的筛选条件
    const cellCondition = document.getElementById('cell_condition').value;
    const artCondition = document.getElementById('ART_condition').value;
    const cancerCondition = document.getElementById('cancer_condition').value;

    // 筛选 miRNA-target 数据
    let filteredMiRTarget = miRTargetData.filter(item => {
        return (
            (cellCondition ? item.cell_condition.includes(cellCondition) : true) &&
            (artCondition ? item.ART_condition.includes(artCondition) : true) &&
            (cancerCondition ? item.cancer_condition.includes(cancerCondition) : true)
        );
    });

    console.log('miRNA-target:', filteredMiRTarget);

    const subcellularCount = {};
    // 提取并统计 Subcellular_location 分类
    // const subcellularLocations = new Set();
    filteredMiRTarget.forEach(item => {
        if (item.Subcellular_location) {
            const locations = item.Subcellular_location[0].split(',');
            locations.forEach(location => {
                subcellularCount[location] = (subcellularCount[location] || 0) + 1;
            });
        }
    });

    console.log('Subcellular Locations:', subcellularCount);

    // 动态生成勾选框
    displaySubcellularTable(subcellularCount);

    // 将筛选后的 miRNA-target 数据保存到全局变量，供下一步使用
    window.filteredMiRTargetStep1 = filteredMiRTarget;
}

// 根据用户选择的条件筛选数据
function filterData() {
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
    // // 获取用户选择的筛选条件
    // const cellCondition = document.getElementById('cell_condition').value;
    // const artCondition = document.getElementById('ART_condition').value;
    // const cancerCondition = document.getElementById('cancer_condition').value;
    // 获取用户选择的模式
    const mode = document.getElementById('mode').value;
    console.log('Current mode selected:', mode);  // 添加日志查看当前选择的模式

    // // 筛选 miRNA-target 数据
    // let filteredMiRTarget = miRTargetData.filter(item => {
    //     return (
    //         (cellCondition ? item.cell_condition.includes(cellCondition) : true) &&
    //         (artCondition ? item.ART_condition.includes(artCondition) : true) &&
    //         (cancerCondition ? item.cancer_condition.includes(cancerCondition) : true)
    //     );
    // });

    // // 提取并统计 Subcellular_location 分类
    // const subcellularLocations = new Set(); // 使用 Set 来去重
    // filteredMiRTarget.forEach(item => {
    //     if (item.Subcellular_location) {
    //         // 拆分字段为独立分类，去除多分类中的逗号和空格
    //         const locations = item.Subcellular_location[0].split(',');
    //         locations.forEach(location => subcellularLocations.add(location)); // 加入 Set
    //     }
    // });

    // console.log('Subcellular Locations:', Array.from(subcellularLocations));

    // 在页面上显示分类数量和具体分类
    // displaySubcellularLocations(subcellularLocations);

    if(mode==='co-regulation'){
        const filteredMiRTargetCount = filteredMiRTarget.reduce((acc, item) => {
            if (!acc[item.miRNA]) {
                acc[item.miRNA] = new Set();
            }
            acc[item.miRNA].add(item.Target_Gene);
            return acc;
        }, {});
        console.log('miRtarget count', filteredMiRTargetCount);
        // 只保留那些 target 数量大于 1 的 miRNA
        const targetsWithMultipleRNAs = Object.keys(filteredMiRTargetCount).filter(target => filteredMiRTargetCount[target].size > 1);
        console.log('miRNAs with multiple targets:', targetsWithMultipleRNAs);
        const filteredmiRNAsWithMultipletargets = filteredMiRTarget.filter(item => {
            // 如果 item.TF 是数组，提取第一个元素
            const miRname = Array.isArray(item.miRNA) ? item.miRNA[0] : item.miRNA;

            // 检查是否包含在 tfWithMultipleMiRNAs 中
            return targetsWithMultipleRNAs.includes(miRname);
        });
        console.log('New mir-target relation:', filteredmiRNAsWithMultipletargets);
        filteredMiRTarget = filteredmiRNAsWithMultipletargets

    }else{
        // 在 "full" 模式下，只执行常规的筛选
        console.log("Full mode selected, skipping co-regulation specific processing.");
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

    // 在页面上生成勾选框
    displayMiRFamilyTable(miRFamilies);

    // 暂存筛选结果以供后续使用
    window.filteredMiRTargetStep2 = filteredMiRTarget;

    // // 获取筛选后的 miRNA 集合（集合 A）
    // let selectedMiRNAs = new Set(filteredMiRTarget.map(item => item.miRNA[0]));
    // console.log('Selected miRNAs:', selectedMiRNAs);
    //
    // // 筛选 TF-miRNA 数据，保留 miRNA 属于集合 A 的关系对
    // const filteredTFMiRNA = TFMiRNAData.filter(item => selectedMiRNAs.has(item.miRNA[0]));
    // console.log('Filtered TF-miRNA Data:', filteredTFMiRNA);
    // // // 统计每个 TF 对应的 miRNA 数量
    // const tfMiRNACount = filteredTFMiRNA.reduce((acc, item) => {
    //     if (!acc[item.TF]) {
    //         acc[item.TF] = new Set();
    //     }
    //     acc[item.TF].add(item.miRNA);
    //     return acc;
    // }, {});
    // console.log('TF-miRNA count:', tfMiRNACount);
    // // 只保留那些 miRNA 数量大于 1 的 TF
    // const tfWithMultipleMiRNAs = Object.keys(tfMiRNACount).filter(tf => tfMiRNACount[tf].size > 1);
    // console.log('TFs with multiple miRNAs:', tfWithMultipleMiRNAs);
    //
    // // 直接使用 tfWithMultipleMiRNAs 筛选出对应的 TF-miRNA 关系对
    // const filteredTFWithMultipleMiRNAs = filteredTFMiRNA.filter(item => {
    //     // 如果 item.TF 是数组，提取第一个元素
    //     const tfName = Array.isArray(item.TF) ? item.TF[0] : item.TF;
    //
    //     // 检查是否包含在 tfWithMultipleMiRNAs 中
    //     return tfWithMultipleMiRNAs.includes(tfName);
    // });
    // console.log('Filtered miRNA-target:', filteredMiRTarget);
    // console.log('Filtered TF-miRNA:', filteredTFWithMultipleMiRNAs);
    //
    //
    // // 更新全局变量
    // globalMiRTargetData = filteredMiRTarget;
    // globalTFMiRNAData = filteredTFMiRNA;
    //
    // // 绘制网络图
    // drawDisjointForceDirectedGraph(globalMiRTargetData, globalTFMiRNAData);



    // 绘制网络图
    // drawNetwork(filteredMiRTarget, filteredTFWithMultipleMiRNAs);
    // drawDisjointForceDirectedGraph(filteredMiRTarget,filteredTFWithMultipleMiRNAs);
    // globalMiRTargetData = filteredMiRTarget;
    // globalTFMiRNAData = filteredTFWithMultipleMiRNAs;
    // drawHierarchicalLayout(filteredMiRTarget, filteredTFWithMultipleMiRNAs);
    // drawConcentricNetwork(filteredMiRTarget, filteredTFWithMultipleMiRNAs);
}

function applyMiRFamilyFilter() {
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

    // 绘制网络图
    drawDisjointForceDirectedGraph(globalMiRTargetData, globalTFMiRNAData);

}



function displaySubcellularTable(subcellularCount) {
    const tableBody = document.getElementById('subcellular-table-body');
    tableBody.innerHTML = '';

    Object.entries(subcellularCount).forEach(([location, count]) => {
        const row = document.createElement('tr');

        // Subcellular location 名称
        const locationCell = document.createElement('td');
        locationCell.textContent = location;
        row.appendChild(locationCell);

        // 数量
        const countCell = document.createElement('td');
        countCell.textContent = count;
        row.appendChild(countCell);

        // 复选框
        const selectCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = location;
        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);

        tableBody.appendChild(row);
    });
}

function displayMiRFamilyTable(miRFamilies) {
    const tableBody = document.getElementById('miRFamilyTableBody');
    tableBody.innerHTML = ''; // 清空内容

    miRFamilies.forEach((count, family) => {
        const row = document.createElement('tr');

        // miR-family 名称
        const familyCell = document.createElement('td');
        familyCell.textContent = family;
        row.appendChild(familyCell);

        // 数量
        const countCell = document.createElement('td');
        countCell.textContent = count;
        row.appendChild(countCell);

        // 复选框
        const selectCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = family;
        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);

        tableBody.appendChild(row);
    });

    // 显示 miRNA-family 信息的表格
    document.getElementById('miRFamilySection').style.display = 'block';
    // 显示 filter2 按钮
    document.getElementById('filter2Button').style.display = 'inline-block';

    // 全选功能的初始化
    const selectAllCheckbox = document.getElementById('selectAllFamilies');
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    // 自动更新全选状态（如果用户手动取消某个复选框）
    tableBody.addEventListener('change', () => {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        selectAllCheckbox.checked = allChecked;
    });
}






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

// // 展示表格数据的函数
// function displayTableData(tableId, data) {
//     const tableBody = document.querySelector(`#${tableId} tbody`);
//     tableBody.innerHTML = '';
//
//     // 填充表格数据
//     data.forEach(item => {
//         const row = document.createElement('tr');
//         for (const key in item) {
//             if (item.hasOwnProperty(key)) {
//                 const td = document.createElement('td');
//                 td.textContent = item[key];
//                 row.appendChild(td);
//             }
//         }
//         tableBody.appendChild(row);
//     });
// }

// 页面加载时加载数据
window.onload = loadData;

// 下载表格功能
// function downloadTabDelimited(fileId) {
//     const table = document.getElementById(fileId);
//     const rows = table.querySelectorAll('tr');
//
//     let content = '';
//
//     // 获取表头
//     rows[0].querySelectorAll('th').forEach((th, index) => {
//         content += th.innerText + '\t'; // 用制表符分隔
//     });
//     content = content.trim() + '\n'; // 移除最后一个制表符，添加换行符
//
//     // 获取表格数据行
//     rows.forEach(row => {
//         let rowData = '';
//         row.querySelectorAll('td').forEach((td, index) => {
//             rowData += td.innerText + '\t'; // 用制表符分隔
//         });
//         if (rowData) {
//             content += rowData.trim() + '\n'; // 移除最后一个制表符，添加换行符
//         }
//     });
//
//     // 创建 Blob 对象
//     const blob = new Blob([content], { type: 'text/plain' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.download = fileId + '.txt'; // 下载文件名
//     link.click();
// }



//下面是绘制网络图的部分

// 网络图绘制函数，默认的力导向布局，节点随机碰撞后的网络
// function drawNetwork(filteredMiRTarget, filteredTFWithMultipleMiRNAs) {
//     // 清理旧的 SVG 内容
//     d3.select("#network").selectAll("*").remove();
//     let nodes = [];
//     let links = [];
//
//     // 处理 miRNA-target 数据，生成节点和链接
//     filteredMiRTarget.forEach(item => {
//         let miRNA = item.miRNA[0];
//         let target = item.Target_Gene[0];
//
//         if (!nodes.some(node => node.id === miRNA)) {
//             nodes.push({id: miRNA, type: 'miRNA'});
//         }
//         if (!nodes.some(node => node.id === target)) {
//             nodes.push({id: target, type: 'target'});
//         }
//
//         links.push({source: miRNA, target: target});
//     });
//     // 处理 TF-miRNA 数据，生成链接
//     filteredTFWithMultipleMiRNAs.forEach(item => {
//         let tf = item.TF[0];
//         let miRNA = item.miRNA[0];
//
//         if (!nodes.some(node => node.id === tf)) {
//             nodes.push({ id: tf, type: 'TF' });
//         }
//         if (!nodes.some(node => node.id === miRNA)) {
//             nodes.push({ id: miRNA, type: 'miRNA' });
//         }
//
//         links.push({ source: tf, target: miRNA });
//     });
//     // 设置 D3.js 网络图的尺寸和力学布局
//     const width = 1200;
//     const height = 800;
//
//
//     const svg = d3.select("#network")
//         .attr("width", width)
//         .attr("height", height)
//         .call(d3.zoom().on("zoom", zoomed)) // 缩放和平移功能
//         .append("g");
//     function zoomed(event) {
//         svg.attr("transform", event.transform); // 应用缩放和平移
//     }
//     const simulation = d3.forceSimulation(nodes)
//         .force("link", d3.forceLink(links).id(d => d.id).distance(100))
//         .force("charge", d3.forceManyBody().strength(-200))
//         .force("collide", d3.forceCollide(30)) // 添加碰撞检测，半径 30
//         .force("center", d3.forceCenter(width / 2, height / 2));
//
//     // 绘制链接
//     const link = svg.selectAll(".link")
//         .data(links)
//         .enter().append("line")
//         .attr("class", "link")
//         .attr("stroke", "#ccc");
//
//     // 绘制节点
//     const node = svg.selectAll(".node")
//         .data(nodes)
//         .enter().append("circle")
//         .attr("class", d => `node ${d.type}`)
//         .attr("r", 10)
//         .attr("fill", d => d.type === "miRNA" ? "blue" : d.type === "TF" ? "red" : "green")
//         .call(d3.drag()
//             .on("start", dragStarted)
//             .on("drag", dragging)
//             .on("end", dragEnded));
//     // 为每个节点添加标签（节点名称）
//     const labels = svg.selectAll(".label")
//         .data(nodes)
//         .enter().append("text")
//         .attr("class", "label")
//         .attr("text-anchor", "middle") // 水平居中对齐
//         .attr("alignment-baseline", "middle") // 垂直居中对齐
//         .attr("font-size", "10px") // 字体大小
//         .attr("fill", "#000") // 设置文本颜色为黑色
//         .text(d => d.id); // 显示节点名称
//
//
//     // 更新力学模拟的节点和链接位置
//     simulation.on("tick", function() {
//         link.attr("x1", d => d.source.x)
//             .attr("y1", d => d.source.y)
//             .attr("x2", d => d.target.x)
//             .attr("y2", d => d.target.y);
//
//         node.attr("cx", d => d.x)
//             .attr("cy", d => d.y);
//         // 更新标签的位置，使其与节点坐标同步
//         labels.attr("x", d => d.x)
//             .attr("y", d => d.y);
//     });
//
//     // 拖拽事件处理函数
//     function dragStarted(event, d) {
//         if (!event.active) simulation.alphaTarget(0.3).restart();
//         d.fx = d.x;
//         d.fy = d.y;
//     }
//
//     function dragging(event, d) {
//         d.fx = event.x;
//         d.fy = event.y;
//     }
//
//     function dragEnded(event, d) {
//         if (!event.active) simulation.alphaTarget(0);
//         d.fx = null;
//         d.fy = null;
//     }
// }

//Disjoint force-directed graph Disjoint情况下的力导向布局，适合网络图被分成很多小簇时数据的展示
function drawDisjointForceDirectedGraph(filteredMiRTarget, filteredTFWithMultipleMiRNAs) {
    const width = 1200, height = 800;

    // 1. 数据整理：转换成 nodes 和 links 格式
    const nodes = [];
    const links = [];
    // 定义实验条件到颜色的映射
    const experimentColors = {
        "Western ": "#e5f5e0",
        "PCR": "#a1d99b",
        "reporter": "#31a354",
        "default": "black"
    };


    filteredMiRTarget.forEach(item => {
        let miRNA = item.miRNA[0];
        let target = item.Target_Gene[0];
        if (!nodes.some(node => node.id === miRNA)) nodes.push({ id: miRNA, group: "miRNA" });
        if (!nodes.some(node => node.id === target)) nodes.push({ id: target, group: "target" });

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
                    links.push({ source: miRNA, target: target, color: experimentColors[key] });
                    matched = true;
                }
            });

            // 如果实验条件未匹配到任何已定义的字段，使用默认颜色
            if (!matched) {
                links.push({ source: miRNA, target: target, color: experimentColors["default"] });
            }
        });
    });
    // 在调试输出 links
    console.log("Generated nodes:", nodes);
    console.log("Generated links:", links);

    filteredTFWithMultipleMiRNAs.forEach(item => {
        let tf = item.TF[0];
        let miRNA = item.miRNA[0];

        if (!nodes.some(node => node.id === tf)) nodes.push({ id: tf, group: "TF" });
        if (!nodes.some(node => node.id === miRNA)) nodes.push({ id: miRNA, group: "miRNA" });

        links.push({ source: tf, target: miRNA, color: experimentColors["default"] });
    });

    // 清理旧图
    d3.select("#network").selectAll("*").remove();
    // 添加 SVG 容器
    const svg = d3.select("#network")
        .attr("width", width)
        .attr("height", height);
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
        .force("charge", d3.forceManyBody().strength(-500)) // 排斥力
        .force("center", d3.forceCenter(width / 2, height / 2)) // 居中力
        .force("TF_center", d3.forceRadial(0, width / 2, height / 2).strength(d => d.group === "target")) // Target 节点居中
        .force("miRNA_radial", d3.forceRadial(200, width / 2, height / 2).strength(d => (d.group === "miRNA" ? 1 : 0))) // miRNA 环绕
        .force("target_radial", d3.forceRadial(400, width / 2, height / 2).strength(d => (d.group === "TF" ? 1 : 0))); // TF 外围

    // 4. 绘制边
    const link = g.append("g")
        .attr("class", "links")
        .attr("stroke-opacity", 0.3)
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("fill", "none")
        .attr("stroke", d => d.color) // 根据 links 的 color 属性设置边的颜色
        .attr("stroke-width", 2)
        .attr("d", d => {
            const dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy) * d.curvature; // 控制弯曲程度
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
    // 5. 绘制节点组
    const node = g.append("g")
        .attr("class", "links")
        .selectAll("g")
        .data(nodes)
        .enter().append("g") // 每个节点的容器
        .attr("class", "node");
    // 绘制节点形状
    node.append("circle")
        .attr("r", 20) // 节点半径
        .attr("fill", d => d.group === "miRNA" ? "#deebf7" : d.group === "TF" ? "#9ecae1" : "#3182bd")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));


    // 添加节点标签
    node.append("text")
        .attr("text-anchor", "middle") // 文本居中
        .attr("dy", "0.35em") // 垂直居中
        .text(d => d.id) // 显示节点名称
        .style("font-size", "12px") // 字体大小
        .style("font-weight", "bold") // 加粗
        .style("fill", "black") // 字体颜色为白色
        .style("pointer-events", "none") // 禁止干扰鼠标事件
        .style("user-select", "none"); // 禁止文本被选中
    // 6. 力学模拟更新位置
    simulation.on("tick", () => {
        link.attr("d", d => {
            const dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy) * 0.6; // 控制弯曲程度
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        node.attr("transform", d => `translate(${d.x},${d.y})`); // 更新节点位置

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
            .attr("stroke-width", d => connectedNodes.has(d.source.id) && connectedNodes.has(d.target.id) ? 4 : 1); // 高亮边加粗

        // 更新节点样式
        node.select("circle")
            .attr("fill-opacity", d => connectedNodes.has(d.id) ? 1 : 0.1) // 高亮节点透明度变高
            .attr("stroke-opacity", d => connectedNodes.has(d.id) ? 1 : 0.1) // 非相关节点透明
            .attr("stroke", d => d.id === selectedNode.id ? "#f00" : "#fff") // 高亮当前节点边框
            .attr("stroke-width", d => d.id === selectedNode.id ? 4 : 1.5); // 高亮当前节点加粗边框

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

        // 重置文字样式
        node.select("text")
            .style("fill-opacity", 1)
            .style("font-weight", "normal");
    }



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
// 添加全选功能
// document.addEventListener('DOMContentLoaded', () => {
//     const selectAllCheckbox = document.getElementById('selectAllFamilies');
//     const miRFamilyTableBody = document.getElementById('miRFamilyTableBody');
//
//     // 监听全选复选框的点击事件
//     selectAllCheckbox.addEventListener('change', () => {
//         const checkboxes = miRFamilyTableBody.querySelectorAll('input[type="checkbox"]');
//         checkboxes.forEach(checkbox => {
//             checkbox.checked = selectAllCheckbox.checked;
//         });
//     });
// });




//绘制圆形的网络图，该布局失败了，miRNA和TF太多导致其占满了整个圆周
// function drawHierarchicalLayout(filteredMiRTarget, filteredTFWithMultipleMiRNAs) {
//     const width = 1200, height = 800;
//
//     // 1. 数据整理
//     const nodes = [];
//     const links = [];
//
//     const targets = new Set();
//     const miRNAs = new Set();
//     const TFs = new Set();
//
//     filteredMiRTarget.forEach(item => {
//         let miRNA = item.miRNA[0];
//         let target = item.Target_Gene[0];
//
//         targets.add(target);
//         miRNAs.add(miRNA);
//
//         links.push({ source: miRNA, target: target });
//     });
//
//     filteredTFWithMultipleMiRNAs.forEach(item => {
//         let tf = item.TF[0];
//         let miRNA = item.miRNA[0];
//
//         TFs.add(tf);
//         miRNAs.add(miRNA);
//
//         links.push({ source: tf, target: miRNA });
//     });
//
//     // 2. 定义节点层次并分组
//     const centerX = width / 2, centerY = height / 2;
//     const radiusStep = 150; // 每一层的间隔半径
//     const layers = { target: 0, miRNA: 1, TF: 2 }; // 层次定义
//     const maxNodesPerLayer = 40; // 每层的最大节点数
//
//     const processedNodes = {};
//     Array.from(targets).forEach((id, i) => {
//         nodes.push({
//             id, group: "target", layer: layers.target,
//             angle: (2 * Math.PI / Math.min(targets.size, maxNodesPerLayer)) * i
//         });
//     });
//     Array.from(miRNAs).forEach((id, i) => {
//         nodes.push({
//             id, group: "miRNA", layer: layers.miRNA,
//             angle: (2 * Math.PI / Math.min(miRNAs.size, maxNodesPerLayer)) * i
//         });
//     });
//     Array.from(TFs).forEach((id, i) => {
//         nodes.push({
//             id, group: "TF", layer: layers.TF,
//             angle: (2 * Math.PI / Math.min(TFs.size, maxNodesPerLayer)) * i
//         });
//     });
//
//     // 3. 计算节点坐标
//     nodes.forEach(node => {
//         const radius = radiusStep * node.layer + (node.group === "target" ? Math.random() * 30 : 0); // 随机偏移避免堆叠
//         node.x = centerX + radius * Math.cos(node.angle);
//         node.y = centerY + radius * Math.sin(node.angle);
//     });
//
//     // 4. 绘制图形
//     d3.select("#network").selectAll("*").remove();
//     const svg = d3.select("#network")
//         .attr("width", width)
//         .attr("height", height);
//
//     // 绘制边
//     svg.append("g")
//         .attr("stroke", "#aaa")
//         .attr("stroke-width", 1)
//         .selectAll("line")
//         .data(links)
//         .enter().append("line")
//         .attr("x1", d => nodes.find(n => n.id === d.source).x)
//         .attr("y1", d => nodes.find(n => n.id === d.source).y)
//         .attr("x2", d => nodes.find(n => n.id === d.target).x)
//         .attr("y2", d => nodes.find(n => n.id === d.target).y);
//
//     // 绘制节点
//     svg.append("g")
//         .selectAll("circle")
//         .data(nodes)
//         .enter().append("circle")
//         .attr("cx", d => d.x)
//         .attr("cy", d => d.y)
//         .attr("r", 8)
//         .attr("fill", d => d.group === "target" ? "green" : d.group === "miRNA" ? "orange" : "blue");
//
//     // 添加节点标签
//     svg.append("g")
//         .selectAll("text")
//         .data(nodes)
//         .enter().append("text")
//         .attr("x", d => d.x)
//         .attr("y", d => d.y - 10)
//         .attr("text-anchor", "middle")
//         .attr("font-size", "8px")
//         .text(d => d.id);
// }
//画圆圈的另一种分层布局，同样失败了
// function drawConcentricNetwork(filteredMiRTarget, filteredTFWithMultipleMiRNAs) {
//     const width = 1200, height = 800;
//     const centerX = width / 2, centerY = height / 2;
//
//     // 1. 数据整理
//     const targetNodes = new Set();
//     const miRNAtoTargets = {};
//     const miRNAtoTFs = {};
//
//     // 解析 miRNA-target 数据
//     filteredMiRTarget.forEach(item => {
//         let target = item.Target_Gene[0];
//         let miRNA = item.miRNA[0];
//         targetNodes.add(target);
//
//         if (!miRNAtoTargets[miRNA]) miRNAtoTargets[miRNA] = new Set();
//         miRNAtoTargets[miRNA].add(target);
//     });
//
//     // 解析 TF-miRNA 数据
//     filteredTFWithMultipleMiRNAs.forEach(item => {
//         let tf = item.TF[0];
//         let miRNA = item.miRNA[0];
//
//         if (!miRNAtoTFs[miRNA]) miRNAtoTFs[miRNA] = new Set();
//         miRNAtoTFs[miRNA].add(tf);
//     });
//
//     // 2. 定义节点和边
//     const nodes = [];
//     const links = [];
//
//     // 添加 Target 节点
//     Array.from(targetNodes).forEach(target => {
//         nodes.push({ id: target, group: "target", x: centerX, y: centerY });
//     });
//
//     // 添加 miRNA 节点
//     const miRNAs = Object.keys(miRNAtoTargets);
//     const miRNARadius = 150; // miRNA 节点距离 Target 的半径
//     miRNAs.forEach((miRNA, i) => {
//         const angle = (2 * Math.PI / miRNAs.length) * i;
//         const x = centerX + miRNARadius * Math.cos(angle);
//         const y = centerY + miRNARadius * Math.sin(angle);
//         nodes.push({ id: miRNA, group: "miRNA", x, y });
//
//         // 连接 miRNA 和 Target
//         miRNAtoTargets[miRNA].forEach(target => {
//             links.push({ source: miRNA, target: target });
//         });
//     });
//
//     // 添加 TF 节点
//     const tfRadius = 80; // TF 节点围绕 miRNA 的半径
//     miRNAs.forEach(miRNA => {
//         const miRNANode = nodes.find(node => node.id === miRNA);
//         if (miRNAtoTFs[miRNA]) {
//             const TFs = Array.from(miRNAtoTFs[miRNA]);
//             TFs.forEach((tf, i) => {
//                 const angle = (2 * Math.PI / TFs.length) * i;
//                 const x = miRNANode.x + tfRadius * Math.cos(angle);
//                 const y = miRNANode.y + tfRadius * Math.sin(angle);
//                 nodes.push({ id: tf, group: "TF", x, y });
//
//                 // 连接 TF 和 miRNA
//                 links.push({ source: tf, target: miRNA });
//             });
//         }
//     });
//
//     // 3. 绘制图形
//     d3.select("#network").selectAll("*").remove();
//     const svg = d3.select("#network")
//         .attr("width", width)
//         .attr("height", height);
//
//     // 绘制边
//     svg.append("g")
//         .attr("stroke", "#aaa")
//         .attr("stroke-width", 1.5)
//         .selectAll("line")
//         .data(links)
//         .enter().append("line")
//         .attr("x1", d => nodes.find(n => n.id === d.source).x)
//         .attr("y1", d => nodes.find(n => n.id === d.source).y)
//         .attr("x2", d => nodes.find(n => n.id === d.target).x)
//         .attr("y2", d => nodes.find(n => n.id === d.target).y);
//
//     // 绘制节点
//     svg.append("g")
//         .selectAll("circle")
//         .data(nodes)
//         .enter().append("circle")
//         .attr("cx", d => d.x)
//         .attr("cy", d => d.y)
//         .attr("r", 8)
//         .attr("fill", d => d.group === "target" ? "yellow" : d.group === "miRNA" ? "red" : "blue")
//         .attr("stroke", "#333")
//         .attr("stroke-width", 1.5);
//
//     // 添加节点标签
//     svg.append("g")
//         .selectAll("text")
//         .data(nodes)
//         .enter().append("text")
//         .attr("x", d => d.x)
//         .attr("y", d => d.y - 10)
//         .attr("text-anchor", "middle")
//         .attr("font-size", "8px")
//         .text(d => d.id);
// }



