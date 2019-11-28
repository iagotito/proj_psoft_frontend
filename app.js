//TODO: reler e refarotrar o código para as rotas erradas ou com possível erro
//      e tratar isso.

// TODO: exigir login para primeira filtragem.
// TODO: resolver bug que a listagem do status "TODAS" está deixando uma campanha de fora.


// TODO: exigir login ao clicar no botão de ver campanha no top 5 do home

const API = "https://psoft-ajude-o-grupo-13.herokuapp.com";
let $top = document.querySelector("#top");
let $body = document.querySelector("#body");
let $message_div = document.querySelector("#message_div");
let storage = window.localStorage;
let globalTimeout = null;

init();

function init () {

    // Top of the site
    if (is_logged()) load_logged_view();
    else load_not_logged_view(); 

    if (window.location.hash === "") 
        window.location.hash = "/home"
    // Body of the site
    if (window.location.hash === "#/home")
        load_home_view();
    // Top of the site
    else if (window.location.hash === "#/sign-up")
        load_sign_up_view();
    else if (window.location.hash === "#/sign-in")
        load_sign_in_view();
    // Body
    else if (window.location.hash.split("/")[1] === "users")
        load_profile_page(window.location.hash.split("/")[2]);
    else if (window.location.hash.split("/")[1] === "campaigns") {
        if (window.location.hash.split("/")[2] === "create")
            load_create_campaign_view();
        else if (window.location.hash.split("/")[2] === "all")
            load_all_campaigns_view();
        else if (window.location.hash.split("/")[2] === "filtered-by")
            load_filtered_campaigns_view(window.location.hash.split("/")[3],
            window.location.hash.split("/")[4],
            window.location.hash.split("/")[5]);
        else
            if ((window.location.hash.split("/")[3]) === undefined)
                load_campaign_view(window.location.hash.split("/")[2]);
            else if ((window.location.hash.split("/")[3]) === "donate")
                load_donate_view_indirectly(window.location.hash.split("/")[2]);
            else if ((window.location.hash.split("/")[3]) === "donations")
                load_donations_history_view_indirectly(window.location.hash.split("/")[2]);
    }
}

// ********** Auxiliary functions **********
function create_user_object (email, fname, lname, password, credit_card) {
    let user = {};
    user.email = email;
    user.fname = fname;
    user.lname = lname;
    user.password = password;
    user.credit_card = credit_card;
    return user;
}

function create_campaign_object (name, description, deadline, goal) {
    let campaign = {};
    campaign.name = name;
    campaign.url = ((name) => {
        let url = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g," ").replace(/\s{2,}/g," ").trim().replace(/ /g,"-");
        return url;
    }) (name);
    campaign.description = description;
    campaign.deadline = deadline;
    campaign.goal = goal;
    return campaign;
}

function is_in_the_past (date) {
    let today = new Date();
    let dd = parseInt(String(today.getDate()).padStart(2, '0'));
    let mm = parseInt(String(today.getMonth() + 1).padStart(2, '0')); //January is 0!
    let yyyy = parseInt(today.getFullYear());

    let year = parseInt(date.substring(6));
    let month =  parseInt(date.substring(3,5));
    let day = parseInt(date.substring(0,2));

    if (year > yyyy)
        return false;
    else if (month > mm)
        return false;
    else if (day > dd)
        return false;
    else 
        return true;
}

function leap_year (year) {
    if (year % 4 === 0) {
        if (year % 100 === 0 && year % 400 !== 0) return false
        else return true;
    }
    else return false;
}

function valid_date (date) {
    let year = parseInt(date.substring(6));
    let month =  parseInt(date.substring(3,5));
    let day = parseInt(date.substring(0,2));

    if (day < 0 || month < 0) return false;

    if (month > 12)
        return false;
    if (leap_year(year)) {
        if (month === 2 && day > 29) 
            return false;
    } else {
        if (month === 2 && day > 28) 
            return false;
    }
    if (month === 1 || month === 3 || month === 5 || month === 7 ||
        month === 8 || month === 10 || month === 12) {
        if (day > 31)
            return false;
    } else {
        if (day > 30)
            return false;
    }
    return true;

}

function cancel () {
    $message_div.innerHTML = "";
    window.location.hash === "/home"
    init();

}

// ********** End of auxiliary functions **********

// ********** Functions to load logged or not logged info **********
//                     (in the top of the page)

function is_logged () {
    if (storage.getItem("token") === null || storage.getItem("token") === "null")
        return false;
    else return true
}

function load_logged_view () {
    let $template = document.querySelector("#logged_view");
    $top.innerHTML = $template.innerHTML;

    let $load_profile_page_button = document.querySelector("#load_profile_page_button");
    $load_profile_page_button.addEventListener("click", () => {
        window.location.hash = "/users/" + storage.getItem("user_email");
        init();
    });

    let $logout_button = document.querySelector("#logout_button");
    $logout_button.addEventListener("click", () => {
        storage.setItem("user_email", null);
        storage.setItem("token", null);
        cancel();
    });

    let $p = document.querySelector("#hello_message");
    let $user;

    let headers = new Headers();
    headers.append("Authorization", "Bearer " + storage.getItem("token"));
    fetch(API + "/users/auth", {
        method:"GET",
        headers: headers
    })
    .then(r => {

        if (r.status === 403 || r.status === 500) {
            storage.setItem("token", null);
            init();
        } else 
            return r.json()
    })
    .then(d => {
        if (d !== undefined) {
            $user = d;
            $p.innerText = "Olá " + $user.fname + " " + $user.lname;
        }
    });

}

function fetch_user_info (email) {
    fetch (API + "/users/" + email, {
        method:"GET",
        headers: {"Content-Type":"application/json"}
    })
    .then (r => {
        return r.json();
    })
    .then (d => {
        let $user_name = document.querySelector("#user_name");
        $user_name.innerText = d.fname + " " + d.lname;

        let $user_email = document.querySelector("#user_email");
        $user_email.innerText = d.email;
    });
}

function load_not_logged_view () {
    let $template = document.querySelector("#not_logged_view");
    $top.innerHTML = $template.innerHTML;

    let $sign_up_button = document.querySelector("#sign_up_button");
    $sign_up_button.addEventListener("click", () => {
        window.location.hash = "/sign-up";
        init();
    });

    let $sign_in_button = document.querySelector("#sign_in_button");
    $sign_in_button.addEventListener("click", () => {
        window.location.hash = "/sign-in";
        init();
    });
}

// ********** End of logged/ not logged functions **********

// ********** Functions to load home page info **********

function load_home_view () {
    let $template = document.querySelector("#home_view");
    $body.innerHTML = $template.innerHTML;

    let $message_login_required = document.querySelector("#message_login_required");

    let $create_campaign = document.querySelector("#create_campaign");
    $create_campaign.addEventListener("click", () => {
        if (is_logged()) {
            $message_login_required.innerText = "";
            window.location.hash = "/campaigns/create";
            init();
        } else
            $message_login_required.innerText = "Você precisa estar logado para criar uma campanha.";
    });

    let $list_all_campaigns = document.querySelector("#list_all_campaigns");
    $list_all_campaigns.addEventListener("click", () => {
        if (is_logged()) {
            $message_login_required.innerText = "";
            window.location.hash = "/campaigns/all";
            init();
        } else 
            $message_login_required.innerText = "Você precisa estar logado para ver a lista de campanhas.";
    })

    let $search_input = document.querySelector("#search_input");
    let $campaigns_filter = document.querySelector("#campaigns_filter");
    let $sort_parameter = document.querySelector("#sort_parameter");
    let $search_campaigns_button = document.querySelector("#search_campaigns_button");

    let $message_login_required_2 = document.querySelector("#message_login_required_2");

    fetch_top_5_campaigns($sort_parameter.value, $campaigns_filter.value);
   
    $search_campaigns_button.addEventListener("click", () => {
        if (is_logged()) {
            $message_login_required_2.innerText = "";
            window.location.hash = "/campaigns/filtered-by/" + $sort_parameter.value + "/" + $campaigns_filter.value + "/" +  $search_input.value;
            load_filtered_campaigns_view($sort_parameter.value, $campaigns_filter.value, $search_input.value);
        } else {
            $message_login_required_2.innerText = "Você precisa estar logado para pesquisar uma campanha";
        }
    });

    // aqui podemos não alterar a listagem, pois o usuário pode não estar logado.
    // então, esses filtros serviviram apenas quando o botão fosse pressionado.
    // a especificação não diz nada sobre isso, apenas sobre o filtro de substring...
    $campaigns_filter.onchange = function() {
        fetch_top_5_campaigns($sort_parameter.value, $campaigns_filter.value);
    };
    $sort_parameter.onchange = function() {
        fetch_top_5_campaigns($sort_parameter.value, $campaigns_filter.value);
    };
}

function fetch_top_5_campaigns (sort, status) {
    let $table = document.querySelector("#top_5_table");
    $table.innerText = "";
    fetch (API + "/campaigns/top-5/filter-by/" + sort + "/" + status, {
        "method":"GET",
        "headers":{"Content-Type":"application/json"}
    })
    .then (r => r.json())
    .then (d => {
        if (d.length === 0) {
            // TODO
        } else {
            let i = 0;
            d.forEach(element => {
                let $row = $table.insertRow(i);

                let $cell1 = $row.insertCell(0);
                let $cell2 = $row.insertCell(1);
                let $cell3 = $row.insertCell(2);
                let $cell4 = $row.insertCell(3);

                $cell1.innerText = element.name;
                $cell2.innerText = "R$" + element.donations + " / R$" + element.goal;
                $cell3.innerText = element.deadline;

                let $campaign_button = document.createElement("BUTTON");
                $campaign_button.innerText = "Ver página da campanha";
                $campaign_button.addEventListener("click", () => {
                    window.location.hash = "/campaigns/" + element.url;
                    init();
                });
                $cell4.appendChild($campaign_button);

                i++;
            });
        }
    });
}

// ********** End of home page functions **********

// ********** Functions to load account views (sign up and sign in) **********

function load_sign_in_view () {
    let $template = document.querySelector("#sign_in_view");
    $top.innerHTML = $template.innerHTML;
    $body.innerHTML = "";

    let $sign_in = document.querySelector("#sign_in");
    $sign_in.addEventListener("click", sign_in);
    let $cancel = document.querySelector("#cancel");
    $cancel.addEventListener("click", () => {
        window.location.hash = "/home";
        cancel();
    });
}

function load_sign_up_view () {
    let $template = document.querySelector("#sign_up_view");
    $top.innerHTML = $template.innerHTML;
    $body.innerHTML = "";

    let $sign_up = document.querySelector("#sign_up");
    $sign_up.addEventListener("click", sign_up);
    let $cancel = document.querySelector("#cancel");
    $cancel.addEventListener("click", () => {
        window.location.hash = "/home";
        cancel();
    });
}

// ---------- Functions to do account actions ----------

function sign_in () {
    let email = document.querySelector("#email").value;
    let password = document.querySelector("#password").value;
    let user = create_user_object(email, "", "", password, "");

    let $email_not_found_message = document.querySelector("#email_not_found_message");
    let $wrong_password_message = document.querySelector("#wrong_password_message");

    let $aux_div = document.querySelector("#aux_div");

    fetch (API + "/auth/login", {
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(user)
    })
    .then(r => {
        if (r.ok) return r.json();
        else {
            if (r.status === 404) {
                $wrong_password_message.innerText = "";
                $aux_div.innerHTML = "";
                $email_not_found_message.innerText = "Usuário não encontrado.";
            }
            else {
                $email_not_found_message.innerText = "";
                $wrong_password_message.innerText = "Senha inválida.";
            }
        }
    })
    .then(d => {
        if (d != undefined) {
            storage.setItem("token", d.token);
            storage.setItem("user_email", email);
            $message_div.innerText = "Login realizado";
            $message_div.append(document.createElement("hr"));
            setTimeout(_ => {
                $message_div.innerHTML = "";
            }, 2000);
            window.location.hash = "/home";
            init();
        }
        
    });
}

function sign_up () {

    let $email_already_exists_message = document.querySelector("#email_already_exists_message");
    let $password_dont_match_message = document.querySelector("#password_dont_match_message");
    let email = document.querySelector("#email").value;
    let fname = document.querySelector("#fname").value;
    let lname = document.querySelector("#lname").value;
    let password = document.querySelector("#password").value;
    let confirm_password = document.querySelector("#confirm_password").value;
    let credit_card = document.querySelector("#credit_card").value;

    let user = create_user_object(email, fname, lname, password, credit_card);

    if (password !== confirm_password) {
        $email_already_exists_message.innerText = "";
        password_dont_match_message.innerText = "As senhas não coincidem";
    } 
    else {
        fetch(API + "/users", {
            method:"POST",
            headers: {"Content-Type":"application/json"},
            body:JSON.stringify(user)
        })
        .then(r => {
            if (r.ok) return r.json();
            else {
                password_dont_match_message.innerText = "";
                $email_already_exists_message.innerText = "Email já cadastrado";
            }
        })
        .then(d => {
            if (d != undefined) {
                $message_div.innerText = "Usuário cadastrado com sucesso!";
                $message_div.append(document.createElement("hr"));
            setTimeout(_ => {
                $message_div.innerHTML = "";
            }, 2000);
            window.location.hash = "/home";
            init();
        }
        });
    }
}

// ********** End of account functions **********

// ********** Functions to load User's profile **********

function load_profile_page (email) {
    let $template = document.querySelector("#profile_page");
    $body.innerHTML = $template.innerHTML;

    let $back_button = document.querySelector("#back_button");
    $back_button.addEventListener("click", () => {
        window.location.hash = "/home";
        init();
    })

    //TODO: NÃO PRECISA DE FETCH, TA SALVO NO BROWSER
    fetch_user_info(email);

    let $search_input = document.querySelector("#search_input");

    fetch_user_campaigns(email, "");
    fetch_campaigns_user_donated (email, "");
   
    $search_input.addEventListener("keyup", () => {
        if(globalTimeout != null) clearTimeout(globalTimeout); 
        globalTimeout = setTimeout(() => {
            fetch_user_campaigns(email, $search_input.value);
            fetch_campaigns_user_donated (email, $search_input.value);
        },500);
    });
}

function fetch_campaigns_user_donated (email, substring) {
    globalTimeout = null;
    let route;
    if (substring === "")
        route = API + "/users/" + email + "/campaignsDonated";
    else
        route = API + "/users/" + email + "/campaignsDonated/" + substring;

    let $table = document.querySelector("#campaigns_user_donated_table");
    fetch (route, {
        "method":"GET",
        "headers":{"Content-Type":"application/json"}
    })
    .then (r => r.json())
    .then (d => {
        $table.innerHTML = "";
        if (d.length === 0) {
            // TODO
        } else {
            let i = 0;
            d.forEach(element => {
                let $row = $table.insertRow(i);

                let $cell1 = $row.insertCell(0);
                let $cell2 = $row.insertCell(1);
                let $cell3 = $row.insertCell(2);
                let $cell4 = $row.insertCell(3);

                $cell1.innerText = element.name;
                $cell2.innerText = "R$" + element.donations + " / R$" + element.goal;
                $cell3.innerText = element.deadline;

                let $campaign_button = document.createElement("BUTTON");
                $campaign_button.innerText = "Ver página da campanha";
                $campaign_button.addEventListener("click", () => {
                    window.location.hash = "/campaigns/" + element.url;
                    init();
                });
                $cell4.appendChild($campaign_button);

                i++;
            });
        }
    });
}

function fetch_user_campaigns(email, substring) {
    globalTimeout = null;
    let route;
    if (substring === "")
        route = API + "/users/" + email + "/campaigns";
    else
        route = API + "/users/" + email + "/campaigns/" + substring;

    let $table = document.querySelector("#user_campaigns_table");
    fetch (route, {
        "method":"GET",
        "headers":{"Content-Type":"application/json"}
    })
    .then (r => r.json())
    .then (d => {
        $table.innerHTML = "";
        if (d.length === 0) {
            // TODO
        } else {
            let i = 0;
            d.forEach(element => {
                let $row = $table.insertRow(i);

                let $cell1 = $row.insertCell(0);
                let $cell2 = $row.insertCell(1);
                let $cell3 = $row.insertCell(2);
                let $cell4 = $row.insertCell(3);

                $cell1.innerText = element.name;
                $cell2.innerText = "R$" + element.donations + " / R$" + element.goal;
                $cell3.innerText = element.deadline;

                let $campaign_button = document.createElement("BUTTON");
                $campaign_button.innerText = "Ver página da campanha";
                $campaign_button.addEventListener("click", () => {
                    window.location.hash = "/campaigns/" + element.url;
                    init();
                });
                $cell4.appendChild($campaign_button);

                i++;
            });
        }
    });
}

// ********** End of user's profile functions **********

// ********** Function to create a new campaign **********

function load_create_campaign_view () {
    let $template = document.querySelector("#create_campaign_view");
    $body.innerHTML = $template.innerHTML;

    let $cancel = document.querySelector("#cancel");
    $cancel.addEventListener("click", () => {
        window.location.hash = "/home";
        cancel();
    });

    let $create_campaign_button = document.querySelector("#create_campaign_button")
    $create_campaign_button.addEventListener("click", create_campaign);
}

// -=-=-=-=-=- Create campaign action -=-=-=-=-=-

function create_campaign () {
    let name = document.querySelector("#name").value;
    let description = document.querySelector("#description").value;
    let deadline = document.querySelector("#deadline").value;
    let goal = document.querySelector("#goal").value.replace(',','.').replace(' ','');
    let $invalid_deadline_message = document.querySelector("#invalid_deadline_message");

    if (deadline.length !== 10 || is_in_the_past(deadline) || !valid_date(deadline)) {
        $invalid_deadline_message.innerText = "Data inválida. Escreva uma data no formato dd/mm/yyyy e que ainda não tenha se passado.";
    } else {
        $invalid_deadline_message.innerText = "";
        let campaign = create_campaign_object(name, description, deadline, goal);
        let $message_span = document.querySelector("#message_span");
        fetch (API + "/campaigns/create", {
            method:"POST",
            headers: {"Content-Type":"application/json",
                      "Authorization":"Bearer " + storage.getItem("token")},
            body: JSON.stringify(campaign)
        })
        .then(r => {
            // TODO: tratar token expirado
            if (r.status === 403)
                $message_span.innerText = "Já existe uma campanha com esse nome, tente outro"
            else {
                $message_span.innerText = "";
                return r.json();
            }
        })
        .then(d => {
            if (d !== undefined) {
                window.location.hash = "/campaigns/" + d.url;
                init();
            }
        });
    }
}

// ********** End of campaigns creation funcions **********

// ********** Functions to load campaigns listing **********

function load_all_campaigns_view () {
    let $template = document.querySelector("#all_campaigns_view");
    $body.innerHTML = $template.innerHTML;

    let $back_button = document.querySelector("#back_button");
    $back_button.addEventListener("click", () => {
        window.location.hash = "/home";
        init();
    });

    let $search_input = document.querySelector("#search_input");
    let $campaigns_filter = document.querySelector("#campaigns_filter");
    let $sort_parameter = document.querySelector("#sort_parameter");
    let $search_campaigns_button = document.querySelector("#search_campaigns_button");

    fetch_campaigns($sort_parameter.value, $campaigns_filter.value, "");
   
    $search_campaigns_button.addEventListener("click", () => {
        window.location.hash = "/campaigns/filtered-by/" + $sort_parameter.value + "/" + $campaigns_filter.value + "/" +  $search_input.value;
        load_filtered_campaigns_view($sort_parameter.value, $campaigns_filter.value, $search_input.value);
    });

    $campaigns_filter.onchange = function() {
        fetch_campaigns($sort_parameter.value, $campaigns_filter.value, "");
    };
    $sort_parameter.onchange = function() {
        fetch_campaigns($sort_parameter.value, $campaigns_filter.value, "");
    };
}

function load_filtered_campaigns_view (sort, status, substring) {
    let $template = document.querySelector("#filtered_campaigns_view");
    $body.innerHTML = $template.innerHTML;

    let status_filter;
    if (status === "active")
        status_filter = "Listando campanhas ativas";
    else if (status === "concluded")
        status_filter = "Listando campanhas concluídas";
    else if (status === "expired")
        status_filter = "Listando campanhas vencidas";
    else
        status_filter = "Listando todas as campanhas"

    let sort_filter;
    if (sort === "likes")
        sort_filter = "curtidas";
    else if (sort === "deadline")
        sort_filter = "data de vencimento";
    else
        sort_filter = "doações";

    let message;
    if (substring === "")
        message = status_filter + ", ordenadas por " + sort_filter;
    else
        message = status_filter + " que contém a palavra: " + substring +
                    ", ordenadas por " + sort_filter;

    let $message_title = document.querySelector("#message_title");
    $message_title.innerText = message;
    let $message_p = document.querySelector("#message_p");
    $message_p.innerText = "Para alterar os critérios de listagem, volte para a página anterior.";
    let $back_button = document.querySelector("#back_button");
    $back_button.addEventListener("click", () => {
        window.location.hash = "/campaigns/all";
        init();
    });

    fetch_campaigns(sort, status, substring);

    let $search_input = document.querySelector("#search_input")
    $search_input.addEventListener("keyup", refresh_filtered_campaigns_table);
}

function refresh_filtered_campaigns_table () {
     let input, filter, table, tr, td, i, txtValue;
     input = document.querySelector("#search_input").value
     filter = input.toUpperCase();
     table = document.getElementById("campaigns_table");
     tr = table.getElementsByTagName("tr");
 
     for (i = 0; i < tr.length; i++) {
         td = tr[i].getElementsByTagName("td")[0];
         if (td) {
             txtValue = td.textContent || td.innerText;
             if (txtValue.toUpperCase().indexOf(filter) > -1) {
                 tr[i].style.display = "";
             } else {
                 tr[i].style.display = "none";
             }
         }
     }
}

function fetch_campaigns(sort, status, substring) {
    let route;
    if (substring === "")
        route = API + "/campaigns/all/filter-by/" + sort + "/" + status;
    else
        route = API + "/campaigns/all/filter-by/" + sort + "/" + status + "/" + substring;
    let $table = document.querySelector("#campaigns_table");
    $table.innerText = "";
    fetch (route, {
        "method":"GET",
        "headers":{"Content-Type":"application/json",
                   "Authorization":"Bearer " + storage.getItem("token")}
    })
    .then (r => {
        // TODO: tratar token expirado.
        return r.json();
    })
    .then (d => {
        $table.innerText = "";
        if (d.length === 0) {
            // TODO: mensagem de nenhuma campanha cadastrada
        } else {
            let i = 0;
            d.forEach(element => {
                let $row = $table.insertRow(i);

                let $cell1 = $row.insertCell(0);
                let $cell2 = $row.insertCell(1);
                let $cell3 = $row.insertCell(2);
                let $cell4 = $row.insertCell(3);

                $cell1.innerText = element.name;
                $cell2.innerText = "R$" + element.donations + " / R$" + element.goal;
                $cell3.innerText = element.deadline;

                let $campaign_button = document.createElement("BUTTON");
                $campaign_button.innerText = "Ver página da campanha";
                $campaign_button.addEventListener("click", () => {
                    window.location.hash = "/campaigns/" + element.url;
                    init();
                });
                $cell4.appendChild($campaign_button);

                i++;
            });
        }
    });
}

// ********** End of campaigns listing functions **********

// ********** Functions to load campaigns pages **********

// -=-=-=-=-=- Campaigns main page -=-=-=-=-=-

function load_campaign_view (campaign_url) {

    fetch (API + "/campaigns/" + campaign_url, {
        "method":"GET",
        "headers":{"Content-Type":"application/json",
                   "Authorization":"Bearer " + storage.getItem("token")}
    })
    .then (r => {
        // todo: tratar token expirado
        if (!r.ok) {
            if (r.status === 404) {
                $message_div.innerText = "Campanha não encontrada.";
                $message_div.append(document.createElement("hr"));
            }
        } else {
            return r.json();
        }
    })
    .then(d => {
        $message_div.innerHTML = "";
        if (d != undefined) {
            // Load campaign info:
            let $template = document.querySelector("#campaign_view");
            $body.innerHTML = $template.innerHTML;

            let $campaign = document.querySelector("#campaign_div");

            let $name = document.querySelector("#name");
            $name.innerText = d.name;

            let $owner = document.querySelector("#owner");
            $owner.innerText = "Criada por: " + d.owner;
            
            let $description = document.querySelector("#description");
            $description.innerText = d.description;

            let $status = document.querySelector("#status");
            $status.innerText = "Status: " + d.status;

            let $progress = document.querySelector("#progress");
            $progress.innerText = "Progresso da campanha:\nR$" + 
                                    Number(d.donations).toFixed(2) + " / R$" + Number(d.goal).toFixed(2);
            let $donate_button = document.querySelector("#donate_button");
            $donate_button.addEventListener("click", () => {
                window.location.hash = "/campaigns/" + d.url + "/donate";
                load_donate_view (d);
            });
            let $see_donations_button = document.querySelector("#see_donations_button");
            $see_donations_button.addEventListener("click", () => {
                window.location.hash = "/campaigns/" + d.url + "/donations";
                load_donations_history_view(d);
            });

            let $deadline = document.querySelector("#deadline");
            $deadline.innerText = "Data de término da campanha:\n" + d.deadline;

            let $likes = document.querySelector("#likes");
            $likes.innerText = d.likes.length + " pessoas curtiram esta campanha.";
            
            // Load like options
            let $like_button = document.querySelector("#like_button");
            if (d.likes.includes(storage.getItem("user_email")))
                $like_button.innerText = "Retirar curtida";
            else
                $like_button.innerText = "Curtir";
            $like_button.addEventListener("click", () => {
                to_like(d, $likes, $like_button);
            })

            let $back_button = document.querySelector("#back_button");
            $back_button.addEventListener("click", () => {
                window.location.hash = "/home";
                init();
            });
            $campaign.appendChild($back_button);

            // Load comments info and options:
            fetch_campaign_comments(d.url);

            let $comment_button = document.querySelector("#comment_button");
            $comment_button.addEventListener("click", () => {
                let $comment_input = document.querySelector("#comment_input");
                let text = $comment_input.value;
                $comment_input.value = "";
                to_comment(d.url, text);
            });
        }
    });
}

function fetch_campaign_comments (url) {
    let $table = document.querySelector("#comments_table");
    $table.innerText = "";
    fetch (API + "/campaigns/" + url + "/comments", {
        method:"GET",
        headers: {"Content-Type":"application/json",
                  "Authorization":"Bearer " + storage.getItem("token")}
    })
    .then(r => r.json()
    )
    .then(d => {
        let i = 0;
        d.forEach(element => {
            let $row = $table.insertRow(i);

            let $cell1 = $row.insertCell(0);
            let $cell2 = $row.insertCell(1);
            let $cell3 = $row.insertCell(2);

            $cell1.innerText = element.owner + " diz: ";
            $cell2.innerText = element.text;
            let $answer_button = document.createElement("BUTTON");
            $answer_button.innerText = "Responder";
            $answer_button.addEventListener("click", () => {
                load_answer_view(element);
            });

            $cell3.appendChild(document.createElement("BR"));
            $cell3.appendChild($answer_button);

            let logged_user_email = storage.getItem("user_email");
            if (logged_user_email === element.owner) {
                let $cell4 = $row.insertCell(3);
                let $delete_comment_button = document.createElement("BUTTON");
                $delete_comment_button.innerText = "Deletar comentário";
                $delete_comment_button.addEventListener("click", () => {
                    delete_comment(element);
                });
                $cell4.appendChild(document.createElement("BR"));
                $cell4.appendChild($delete_comment_button);
            }
        })
    });
}

// -=-=-=-=-=- Campaigns actions -=-=-=-=-=-

function load_donate_view_indirectly (url) {
    fetch (API + "/campaigns/" + url, {
        method:"GET",
        headers: {"Content-Type":"application/json",
        "Authorization":"Bearer " + storage.getItem("token")}
    })
    .then (r => {
        return r.json();
    })
    .then (d => {
        load_donate_view (d);
    })
}

function load_donate_view (campaign) {

    let $template = document.querySelector("#donate_view");
    $body.innerHTML = $template.innerHTML;

    let $message_title = document.querySelector("#message_title");
    $message_title.innerText = "Fazer uma doação para: " + campaign.name;


    let $confirm_donate_button = document.querySelector("#confirm_donate_button");
    $confirm_donate_button.addEventListener("click", () => {
        donate(campaign.url);
    });

    let $back_to_campaign_button = document.querySelector("#back_to_campaign_button");
    $back_to_campaign_button.addEventListener("click", () => {
        window.location.hash = "/campaigns/" + campaign.url;
        init();
    });
}

function donate (url) {
    let $donation_value = document.querySelector("#donation_value");
    let amount = $donation_value.value.replace(',','.').replace(' ','');
    fetch (API + "/campaigns/" + url + "/donations", {
        method:"POST",
        headers: {"Content-Type":"application/json",
                  "Authorization":"Bearer " + storage.getItem("token")},
        body:`{"amount":"${amount}"}`
    })
    .then (r => {
        // todo: tratar token expirado
        //TODO: tratar possíveis erros de not found ou unauthorized
        return r.json();
    })
    .then (d => {
        //todo: mensagem de sucesso na doação
        window.location.hash = "/campaigns/" + d.campaign;
        init();
    });
}

function to_like (campaign, $likes, $like_button) {
    fetch (API + "/campaigns/" + campaign.url + "/likes", {
        method:"POST",
        headers: {"Content-Type":"application/json",
                  "Authorization":"Bearer " + storage.getItem("token")}
    })
    .then (r => {
        // todo: tratar token expirado
        return r.json();
    })
    .then (d => {
        $likes.innerText = d.likes.length + " pessoas curtiram esta campanha.";
        if (d.likes.includes(storage.getItem("user_email")))
            $like_button.innerText = "Retirar curtida";
        else
            $like_button.innerText = "Curtir";
    });
}

// ---------- Comments and answers ----------

function to_comment (url, text) {
    fetch (API + "/campaigns/" + url + "/comments", {
        method:"POST",
        headers: {"Content-Type":"application/json",
        "Authorization":"Bearer " + storage.getItem("token")},
        body:`{"text":"${text}"}`
    })
    .then (r => {
        //todo: tratar token expirado
        //todo: tratar possíveis erros como 404 para uma camapnha que não existe
        return r.json();
    })
    .then (d => {
        // todo: mostrar ou retirar mensagens
        // Depois de adicionar o comentário, faz o refresh dos comentários
        fetch_campaign_comments(url);
    });
}

function delete_comment (comment) {
    fetch (API + "/campaigns/" + comment.campaign + "/comments/" + comment.id, {
        method:"DELETE",
        headers: {"Content-Type":"application/json",
                  "Authorization":"Bearer " + storage.getItem("token")}
    })
    .then (r => {
        //todo: tratar token expirado
        return r.json();
    })
    .then (d => {
        fetch_campaign_comments(comment.campaign);
    });
}

function load_answer_view (comment) {
    let $template = document.querySelector("#answer_view");
    $body.innerHTML = $template.innerHTML;

    let $campaign_name = document.querySelector("#campaign_name");

    let $back_button = document.querySelector("#back_button");
    $back_button.addEventListener("click", () => {
        load_campaign_view(comment.campaign);
    });

    let $comment_info = document.querySelector("#comment_info");

    $campaign_name.innerText = comment.campaign;
    $comment_info.innerText = comment.owner + " diz: " + comment.text;

    let $answer_button = document.querySelector("#answer_button");
    $answer_button.addEventListener("click", () => {
        let $answer_input = document.querySelector("#answer_input");
        let text = $answer_input.value;
        $answer_input.value = "";
        to_answer(comment, text);
    });

    fetch_comment_answers(comment);
}

function to_answer (comment, text) {
    fetch (API + "/campaigns/" + comment.campaign + "/comments/" + comment.id + "/answers", {
        method:"POST",
        headers: {"Content-Type":"application/json",
                  "Authorization":"Bearer " + storage.getItem("token")},
        body:`{"text":"${text}"}`
    })
    .then (r => {
        //todo: tratar token expirado
        return r.json();
    })
    .then (d => {
        fetch_comment_answers(comment);
    })
}

function fetch_comment_answers (comment) {
    let $table = document.querySelector("#answers_table");
    $table.innerText = "";
    fetch (API + "/campaigns/" + comment.campaign + "/comments/" + comment.id + "/answers", {
        method:"GET",
        headers: {"Content-Type":"application/json",
                  "Authorization":"Bearer " + storage.getItem("token")}
    })
    .then(r => {
        //todo: tratar token expirado
        return r.json()
    })
    .then(d => {
        let i = 0;
        d.forEach(element => {
            let $row = $table.insertRow(i);

            let $cell1 = $row.insertCell(0);
            let $cell2 = $row.insertCell(1);

            $cell1.innerText = element.owner + " diz: ";
            $cell2.innerText = element.text;

            let logged_user_email = storage.getItem("user_email");
            if (logged_user_email === element.owner) {
                let $cell3 = $row.insertCell(2);
                let $delete_answer_button = document.createElement("BUTTON");
                $delete_answer_button.innerText = "Deletar resposta";
                $delete_answer_button.addEventListener("click", () => {
                    delete_answer(comment, element);
                });
                $cell3.appendChild(document.createElement("BR"));
                $cell3.appendChild($delete_answer_button);
            }
        })
    });
}

function delete_answer (comment, answer) {
    fetch (API + "/campaigns/" + comment.campaign + "/comments/" + answer.id, {
        method:"DELETE",
        headers: {"Content-Type":"application/json",
                  "Authorization":"Bearer " + storage.getItem("token")}
    })
    .then (r => {
        // todo: tratar token expirado
        return r.json();
    })
    .then (d => {
        fetch_comment_answers(comment);
    });
}

// -=-=-=-=-=- Campaigns donations info -=-=-=-=-=-

function load_donations_history_view_indirectly (url) {
    fetch (API + "/campaigns/" + url, {
        "method":"GET",
        "headers":{"Content-Type":"application/json"}
    })
    .then (r => {
        return r.json();
    })
    .then (d => {
        load_donations_history_view (d);
    });
}

function load_donations_history_view (campaign) {
    let $template = document.querySelector("#doante_history_view");
    $body.innerHTML = $template.innerHTML;

    let $campaign_name = document.querySelector("#campaign_name");

    let $back_button = document.querySelector("#back_button");
    $back_button.addEventListener("click", () => {
        load_campaign_view(campaign.url);
    });
    $campaign_name.innerText = campaign.name;

    load_donations_history (campaign);
}

function load_donations_history (campaign) {
    let $table = document.querySelector("#donations_table");
    $table.innerText = "";
    fetch (API + "/campaigns/" + campaign.url + "/donations", {
        "method":"GET",
        "headers":{"Content-Type":"application/json"}
    })
    .then (r => {
        // todo: trater token expirado
        return r.json();
    })
    .then (d => {
        if (d.length === 0) {
            // TODO
        } else {
            let i = 0;
            d.forEach(element => {
                let $row = $table.insertRow(i);

                let $cell1 = $row.insertCell(0);
                let $cell2 = $row.insertCell(1);
                let $cell3 = $row.insertCell(2);
                let $cell4 = $row.insertCell(3);

                $cell1.innerText = element.owner;
                $cell2.innerText = "R$" + element.amount;
                $cell3.innerText = element.date;

                let $user_button = document.createElement("BUTTON");
                $user_button.innerText = "Ver página do usuário";
                $user_button.addEventListener("click", () => {
                    window.location.hash = "/users/" + element.owner;
                    init();
                });
                $cell4.appendChild($user_button);

                i++;
            });
        }
    });
}

// ********** End of campaigns functions **********

// ********** End of the code **********