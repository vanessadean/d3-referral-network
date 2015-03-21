require 'csv'
require 'json'

def parse_for(doctor)
  data = {}
  data["nodes"] = []
  data["links"] = []

  targets = []

  CSV.foreach("../data/DataForVanessa.csv") do |row|
    if row[0] == doctor && row[0] != row[3]
      node1 = data["nodes"].detect { |node| node["name"] == row[0] }
      node2 = data["nodes"].detect { |node| node["name"] == row[3] }

      if node1
        node1["total_referrals"] += 1
      else
        data["nodes"] << {"name" => row[0], "practice" => row[1], "specialty" => row[2], "total_referrals" => 1}
      end

      if node2
        node2["total_referrals"] += 1
      else
        data["nodes"] << {"name" => row[3], "practice" => row[4], "specialty" => row[5], "total_referrals" => 1}
      end

      unless data["links"].any? { |link| link == { "source" => row[0], "target" => row[3] } }
        data["links"] << { "source" => row[0], "target" => row[3] }
        targets << row[3]
      end
    end
  end

  CSV.foreach("../data/DataForVanessa.csv") do |row|
    targets.each do |target|
      if row[0] == target && row[4] != "Premier Orthopaedics"
        node1 = data["nodes"].detect { |node| node["name"] == row[0] }
        node2 = data["nodes"].detect { |node| node["name"] == row[3] }

        if !node1
          data["nodes"] << {"name" => row[0], "practice" => row[1], "specialty" => row[2], "total_referrals" => 1}
        else
          node1["total_referrals"] += 1
        end

        if !node2
          data["nodes"] << {"name" => row[3], "practice" => row[4], "specialty" => row[5], "total_referrals" => 1}
        else
          node2["total_referrals"] += 1
        end

        unless data["links"].any? { |link| link == { "source" => row[0], "target" => row[3] } }
          data["links"] << { "source" => row[0], "target" => row[3] }
        end
      end
    end
  end

  File.open("../data/#{doctor.split(" ").last.downcase}-with-secondary.json", 'w') do |file|
    file.puts JSON.pretty_generate(JSON.parse(data.to_json))
  end
end

parse_for("Howard Baruch")


